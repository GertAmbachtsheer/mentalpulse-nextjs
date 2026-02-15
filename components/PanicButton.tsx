'use client';

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { panicAlertsApi } from "@/lib/convexCalls";
import { toast } from "sonner";
import { useLocationStore } from "@/store/locationStore";
import { requestNotificationPermission } from "@/lib/pushNotifications";

export default function PanicButton() {
    const { user } = useUser();
    const [isPressed, setIsPressed] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const { isLocationEnabled } = useLocationStore();
    const [isLoading, setIsLoading] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    
    const activeAlert = useQuery(
        panicAlertsApi.getUserActivePanicAlert,
        user?.id ? { userId: user.id } : "skip"
    );
    
    const triggerPanicMutation = useMutation(panicAlertsApi.triggerPanicAlert);
    const dismissPanicMutation = useMutation(panicAlertsApi.dismissPanicAlert);

    // const sendTestNotification = async (type: string) => {
    //     setIsLoading(true);
    //     try {
    //     await fetch('/api/notifications/create', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             type,
    //             title: `Test ${type} notification`,
    //             message: `This is a ${type} notification sent at ${new Date().toLocaleTimeString()}`,
    //         }),
    //     });
    //     } catch (error) {
    //         console.error('Error sending notification:', error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }

    useEffect(() => {
        const initNotifications = async () => {
          const permission = await requestNotificationPermission();
          setNotificationPermission(permission);
          
          if (permission === 'denied') {
            console.warn('Notification permission denied. Panic alerts will not be shown.');
          }
        };
        
        initNotifications();
      }, []);
    
    const handleEmergencyClick = async () => {
        if (isTriggering) return;

        // Wait for query to load
        if (activeAlert === undefined) {
            console.log("Query still loading, please wait...");
            return;
        }
        
        setIsPressed(true);
        setIsTriggering(true);
        
        // If there's an active alert, dismiss it
        if (activeAlert) {
            await dismissPanicMutation({ alertId: activeAlert._id });
            toast.success("Emergency alert deactivated", {
                description: "Your panic alert has been turned off.",
                duration: 3000,
            });
            setIsTriggering(false);
            setTimeout(() => setIsPressed(false), 300);
            return;
        }

        try {
            // Get current location
            if (!navigator.geolocation) {
                toast.error("Geolocation is not supported by your browser");
                setIsTriggering(false);
                setTimeout(() => setIsPressed(false), 300);
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        // Trigger panic alert
                        const alertId = await triggerPanicMutation({
                            userId: user?.id!,
                            latitude: position.coords.latitude.toString(),
                            longitude: position.coords.longitude.toString(),
                        });

                        try {
                            await fetch('/api/notifications/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'panicAlert',
                                    title: "EMERGENCY ALERT",
                                    message: JSON.stringify({"alertId": alertId, "userId": user?.id}),
                                }),
                            });
                        } catch (error) {
                            console.error('Error sending notification:', error);
                        } finally {
                            setIsLoading(false);
                        }
                        
                        toast.success("Emergency alert activated!", {
                            description: "Nearby users have been notified.",
                            duration: 5000,
                        });
                    } catch (error) {
                        toast.error("Failed to send emergency alert");
                    } finally {
                        setIsTriggering(false);
                        setTimeout(() => setIsPressed(false), 300);
                    }
                },
                (error) => {
                    toast.error("Unable to get your location", {
                        description: "Please enable location services and try again.",
                    });
                    setIsTriggering(false);
                    setTimeout(() => setIsPressed(false), 300);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                }
            );
        } catch (error) {
            toast.error("An error occurred");
            setIsTriggering(false);
            setTimeout(() => setIsPressed(false), 300);
        }
    };

    return (
        <section className="mx-2 mt-1 mb-1 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8 shadow-lg border-2 border-red-200">
            <div className="flex justify-center items-center mb-6">
                <button
                    onClick={handleEmergencyClick}
                    disabled={isTriggering || activeAlert === undefined}
                    className={`
                        relative w-50 h-50 rounded-full
                        ${activeAlert 
                            ? 'bg-gradient-to-br from-red-600 via-red-500 to-red-700 hover:shadow-red-500/50 focus:ring-red-400 animate-pulse'
                            : 'bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 hover:shadow-orange-500/50 focus:ring-orange-400'
                        }
                        shadow-2xl
                        transform transition-all duration-200
                        hover:scale-105
                        active:scale-95
                        focus:outline-none focus:ring-4
                        ${isPressed ? 'scale-95' : ''}
                        ${isTriggering || activeAlert === undefined ? 'opacity-75 cursor-not-allowed' : ''}
                        group
                    `}
                    aria-label={activeAlert ? "Deactivate panic alert" : "Activate panic alert"}
                >
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                        <div className="text-center">
                        <div className="text-4xl font-black tracking-wider mb-2">
                            {activeAlert 
                            ? (isTriggering ? "PULSE" : "ACTIVE")
                            : (isTriggering ? "ACTIVE" : "PULSE")
                            }
                        </div>
                        </div>
                    </div>

                    {/* Inner glow effect */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-t from-transparent to-white/20 pointer-events-none"></div>
                </button>
            </div>
            <div className="mt-6 pt-6 border-t-2 border-red-200">
                <p className="text-xs text-center text-gray-500">
                This will immediately send out a distress signal
                </p>
            </div>
        </section>
    );
}