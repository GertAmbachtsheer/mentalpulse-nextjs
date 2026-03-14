'use client';

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { getUserActivePanicAlert } from "@/lib/supabaseCalls";
import { toast } from "sonner";

export default function PanicButton() {
    const { user } = useUser();
    const [isPressed, setIsPressed] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const [activeAlert, setActiveAlert] = useState<any | null | undefined>(undefined);

    const fetchActiveAlert = useCallback(async () => {
        if (!user?.id) return;
        try {
            const data = await getUserActivePanicAlert(user.id);
            setActiveAlert(data);
        } catch (err) {
            console.error("Error fetching active alert:", err);
            setActiveAlert(null);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchActiveAlert();
    }, [fetchActiveAlert]);

    const handleEmergencyClick = async () => {
        if (isTriggering) return;

        if (activeAlert === undefined) return;

        setIsPressed(true);
        setIsTriggering(true);

        // Cancel active alert
        if (activeAlert) {
            try {
                await fetch('/api/panic-alerts/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alertId: activeAlert.id, userId: user?.id }),
                });
                toast.success("Emergency alert deactivated", {
                    description: "Your panic alert has been turned off.",
                    duration: 3000,
                });
            } catch (err) {
                console.error("Error cancelling alert:", err);
                toast.error("Failed to cancel alert");
            }
            setIsTriggering(false);
            setTimeout(() => setIsPressed(false), 300);
            await fetchActiveAlert();
            return;
        }

        // Trigger new alert
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            setIsTriggering(false);
            setTimeout(() => setIsPressed(false), 300);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const response = await fetch('/api/panic-alerts/trigger', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: user?.id,
                            latitude: position.coords.latitude.toString(),
                            longitude: position.coords.longitude.toString(),
                        }),
                    });

                    if (!response.ok) throw new Error('Failed to trigger panic alert');

                    toast.success("Emergency alert activated!", {
                        description: "Your emergency alert has been recorded.",
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
            () => {
                toast.error("Unable to get your location", {
                    description: "Please enable location services and try again.",
                });
                setIsTriggering(false);
                setTimeout(() => setIsPressed(false), 300);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    return (
        <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-main dark:text-white">Emergency</h3>
                {activeAlert && (
                    <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Live
                    </span>
                )}
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-soft relative overflow-hidden">
                {activeAlert ? (
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-500/10 blur-2xl"></div>
                ) : (
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/5 blur-2xl"></div>
                )}

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium text-center">
                    {activeAlert
                        ? "Your emergency alert is active and shared."
                        : "Press the button below to send an emergency alert."}
                </p>

                <div className="flex justify-center items-center my-8">
                    <button
                        onClick={handleEmergencyClick}
                        disabled={isTriggering || activeAlert === undefined}
                        className={`
                            relative w-48 h-48 rounded-full
                            ${activeAlert
                                ? 'bg-gradient-to-br from-red-600 via-red-500 to-red-600 focus:ring-red-400 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                                : 'bg-gradient-to-br from-orange-500 via-orange-400 to-orange-500 focus:ring-orange-400 shadow-[0_10px_30px_rgba(249,115,22,0.3)]'
                            }
                            transform transition-all duration-300 ease-out
                            hover:scale-105
                            active:scale-[0.98]
                            focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-white dark:focus:ring-offset-surface-dark
                            ${isPressed ? 'scale-[0.98] shadow-inner' : ''}
                            ${(isTriggering || activeAlert === undefined) ? 'opacity-80 cursor-not-allowed scale-[0.98] saturate-50' : ''}
                            group
                        `}
                        aria-label={activeAlert ? "Deactivate panic alert" : "Activate panic alert"}
                    >
                        {activeAlert && (
                            <>
                                <div className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_100ms]"></div>
                            </>
                        )}

                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                            <span className={`material-symbols-outlined text-[48px] mb-2 ${activeAlert ? 'animate-bounce' : ''}`}>
                                {activeAlert ? 'campaign' : 'emergency'}
                            </span>
                            <div className="text-2xl font-black tracking-widest uppercase text-white/95">
                                {activeAlert
                                    ? (isTriggering ? "DEACTIVATING" : "ACTIVE")
                                    : (isTriggering ? "ACTIVATING" : "PULSE")
                                }
                            </div>
                        </div>

                        <div className="absolute inset-[3px] rounded-full border top-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none opacity-50 mix-blend-overlay"></div>
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <p className="text-[11px] text-center text-slate-400 font-medium uppercase tracking-wider">
                        {activeAlert ? "Tap again to cancel" : "Tap to send an alert"}
                    </p>
                </div>
            </div>
        </section>
    );
}
