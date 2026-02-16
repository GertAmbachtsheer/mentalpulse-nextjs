'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getUserActivePanicAlert, dismissPanicAlert } from "@/lib/supabaseCalls";
import { usePanicAlertStore } from "@/store/panicAlertStore";
import { toast } from "sonner";

export default function PanicButton() {
    const router = useRouter();
    const { user } = useUser();
    const [isPressed, setIsPressed] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const [activeAlert, setActiveAlert] = useState<any | null | undefined>(undefined);
    const { activeResponseAlert, setActiveResponseAlert, clearActiveResponseAlert } = usePanicAlertStore();

    // Fetch active alert
    const fetchActiveAlert = useCallback(async () => {
        // Don't poll if user is responding to someone else
        if (!user?.id || activeResponseAlert) return;
        try {
            const data = await getUserActivePanicAlert(user.id);
            setActiveAlert(data);
        } catch (err) {
            console.error("Error fetching active alert:", err);
            setActiveAlert(null);
        }
    }, [user?.id, activeResponseAlert]);

    useEffect(() => {
        fetchActiveAlert();
    }, [fetchActiveAlert]);

    // Poll for responses to active alert
    useEffect(() => {
        if (!activeAlert || !user?.id || activeResponseAlert) return;

        const pollForResponse = async () => {
            try {
                const res = await fetch('/api/panic-alerts/active-response', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id }),
                });
                const data = await res.json();

                if (data.alert && data.alert.responderUserId) {
                    // Someone responded! Navigate to tracking page
                    setActiveResponseAlert({
                        alertId: data.alert.id,
                        creatorUserId: data.alert.creatorUserId,
                        responderUserId: data.alert.responderUserId,
                        creatorLatitude: data.alert.creatorLatitude,
                        creatorLongitude: data.alert.creatorLongitude,
                        responderLatitude: data.alert.responderLatitude || '',
                        responderLongitude: data.alert.responderLongitude || '',
                    });
                    router.push('/tracking');

                    toast.success("Someone is coming to help!", {
                        description: "A responder is on their way to your location.",
                        duration: 5000,
                    });

                    // Re-fetch to update button state
                    await fetchActiveAlert();
                }
            } catch (err) {
                console.error("Error polling for response:", err);
            }
        };

        const interval = setInterval(pollForResponse, 10000);
        return () => clearInterval(interval);
    }, [activeAlert, user?.id, activeResponseAlert, setActiveResponseAlert, fetchActiveAlert]);
    
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
            await dismissPanicAlert(activeAlert.id);
            clearActiveResponseAlert();
            toast.success("Emergency alert deactivated", {
                description: "Your panic alert has been turned off.",
                duration: 3000,
            });
            setIsTriggering(false);
            setTimeout(() => setIsPressed(false), 300);
            await fetchActiveAlert();
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
                        // Call the server-side trigger endpoint 
                        // This creates the alert AND sends Web Push to all users
                        const response = await fetch('/api/panic-alerts/trigger', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: user?.id,
                                latitude: position.coords.latitude.toString(),
                                longitude: position.coords.longitude.toString(),
                            }),
                        });

                        if (!response.ok) {
                            throw new Error('Failed to trigger panic alert');
                        }
                        
                        toast.success("Emergency alert activated!", {
                            description: "All users have been notified via push notification.",
                            duration: 5000,
                        });
                        await fetchActiveAlert();
                    } catch (error) {
                        console.error('Error triggering panic alert:', error);
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