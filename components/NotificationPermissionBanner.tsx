'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/pushNotifications';

export default function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setShowBanner(Notification.permission === 'default');
    }
  }, []);

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <Bell className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Enable Emergency Alerts</h3>
            <p className="text-sm text-white/90 mb-3">
              Get notified when someone nearby needs help. Enable push notifications to receive emergency alerts.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnableNotifications}
                className="bg-white text-orange-600 px-4 py-2 rounded-md font-medium text-sm hover:bg-orange-50 transition-colors"
              >
                Enable Notifications
              </button>
              <button
                onClick={handleDismiss}
                className="bg-white/20 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-white/30 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <BellOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
