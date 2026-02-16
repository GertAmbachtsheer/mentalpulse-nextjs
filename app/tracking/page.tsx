'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { usePanicAlertStore } from '@/store/panicAlertStore';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { dismissPanicAlert } from '@/lib/supabaseCalls'; // Keep for responding side cleanup if needed, but cancel uses API now
import AlertResponseMap from '@/components/AlertResponseMap';
import NotificationCenter from '@/components/NotificationCenter';
import { Button } from '@/components/ui/button';
import { Navigation, ArrowLeft, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TrackingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { 
    activeResponseAlert, 
    clearActiveResponseAlert, 
    alertCancelledNotice, 
    setAlertCancelledNotice 
  } = usePanicAlertStore();

  // Keep push subscription active on this page too
  usePushSubscription();

  const isResponder = user?.id === activeResponseAlert?.responderUserId;
  const isCreator = user?.id === activeResponseAlert?.creatorUserId;
  const [isCancelling, setIsCancelling] = useState(false);

  // Poll for alert status (in case push notification is missed)
  useEffect(() => {
    if (!activeResponseAlert?.alertId || !isResponder) return;

    const checkAlertStatus = async () => {
      try {
        const res = await fetch(`/api/panic-alerts/status?id=${activeResponseAlert.alertId}`);
        const data = await res.json();
        
        // If alert is no longer active or doesn't exist, it was cancelled/dismissed
        if (!data.alert || data.alert.active === false) {
          setAlertCancelledNotice(true);
        }
      } catch (error) {
        console.error('Error checking alert status:', error);
      }
    };

    const interval = setInterval(checkAlertStatus, 5000);
    return () => clearInterval(interval);
  }, [activeResponseAlert?.alertId, isResponder, setAlertCancelledNotice]);

  // Redirect to home if no active alert data
  useEffect(() => {
    if (isLoaded && !activeResponseAlert) {
      router.replace('/');
    }
  }, [isLoaded, activeResponseAlert, router]);

  const handleClose = () => {
    clearActiveResponseAlert();
    router.push('/');
  };

  const handleCancelAlert = async () => {
    if (!activeResponseAlert?.alertId || !user?.id || isCancelling) return;
    setIsCancelling(true);
    try {
      // Call API to cancel (dismisses in DB + notifies responder)
      await fetch('/api/panic-alerts/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: activeResponseAlert.alertId,
          userId: user.id
        }),
      });

      clearActiveResponseAlert();
      toast.success('Alert cancelled', {
        description: 'Your panic alert has been deactivated.',
        duration: 3000,
      });
      router.push('/');
    } catch (err) {
      console.error('Error cancelling alert:', err);
      toast.error('Failed to cancel alert. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDismissCancellationNotice = () => {
    setAlertCancelledNotice(false);
    clearActiveResponseAlert();
    router.push('/');
  };

  if (!isLoaded || !activeResponseAlert) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="animate-pulse text-gray-500 text-lg">Loading tracking...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* NotificationCenter stays active so SW messages are handled */}
      <NotificationCenter />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <Navigation className="size-5" />
          <div>
            <h1 className="font-semibold text-base">
              {isResponder ? 'Navigating to Person in Need' : 'Help is on the Way'}
            </h1>
            <p className="text-xs text-emerald-100">
              {isResponder ? 'Head to the location shown below' : 'Someone is coming to help you'}
            </p>
          </div>
        </div>
      </header>

      {/* Full-screen map */}
      <main className="flex-1 min-h-0 relative">
        <AlertResponseMap />
      </main>

      {/* Alert Cancelled Dialog for Responder */}
      {alertCancelledNotice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-12 rounded-full bg-green-100 flex items-center justify-center">
                <Navigation className="size-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Alert Cancelled</h2>
                <p className="text-gray-500 mt-2">
                  The person who triggered the alert has cancelled it. You can now return to the main dashboard.
                </p>
              </div>
              <Button 
                onClick={handleDismissCancellationNotice}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Okay, got it
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-4 py-3 bg-white border-t shadow-inner shrink-0 flex flex-col gap-2">
        {isCreator && (
          <Button
            onClick={handleCancelAlert}
            disabled={isCancelling}
            variant="destructive"
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-base py-5 gap-2"
          >
            <XCircle className="size-5" />
            {isCancelling ? 'Cancelling...' : 'Cancel Alert'}
          </Button>
        )}
        <Button
          onClick={handleClose}
          className={`w-full text-base py-5 ${
            isCreator
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
          }`}
        >
          {isResponder ? "I've Arrived" : 'Close Tracking'}
        </Button>
      </footer>
    </div>
  );
}
