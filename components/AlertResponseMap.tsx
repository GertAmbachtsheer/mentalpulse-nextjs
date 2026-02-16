'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Map, MapMarker, MarkerContent, MarkerLabel, MapRoute, MapRef } from '@/components/ui/map';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePanicAlertStore } from '@/store/panicAlertStore';
import { X, Navigation } from 'lucide-react';

export default function AlertResponseMap() {
  const { user } = useUser();
  const { activeResponseAlert, showResponseMap, clearActiveResponseAlert } = usePanicAlertStore();
  const mapRef = useRef<MapRef>(null);
  const [responderLocation, setResponderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCreator = user?.id === activeResponseAlert?.creatorUserId;
  const isResponder = user?.id === activeResponseAlert?.responderUserId;

  // Parse locations
  const creatorLat = parseFloat(activeResponseAlert?.creatorLatitude || '0');
  const creatorLng = parseFloat(activeResponseAlert?.creatorLongitude || '0');
  const initialResponderLat = parseFloat(activeResponseAlert?.responderLatitude || '0');
  const initialResponderLng = parseFloat(activeResponseAlert?.responderLongitude || '0');

  // Update responder location periodically (for the responder side, use their live GPS)
  const updateResponderLocation = useCallback(() => {
    if (isResponder && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setResponderLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => console.error('Error getting responder location:', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [isResponder]);

  // For the creator side, poll the API for updated responder location
  const fetchResponderLocation = useCallback(async () => {
    if (!isCreator || !user?.id) return;
    try {
      const res = await fetch('/api/panic-alerts/active-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.alert?.responderLatitude && data.alert?.responderLongitude) {
        setResponderLocation({
          lat: parseFloat(data.alert.responderLatitude),
          lng: parseFloat(data.alert.responderLongitude),
        });
      }
    } catch (err) {
      console.error('Error fetching responder location:', err);
    }
  }, [isCreator, user?.id]);

  useEffect(() => {
    if (!showResponseMap || !activeResponseAlert) return;

    // Set initial responder location
    if (initialResponderLat && initialResponderLng) {
      setResponderLocation({ lat: initialResponderLat, lng: initialResponderLng });
    }

    // Start polling/tracking
    if (isResponder) {
      updateResponderLocation();
      intervalRef.current = setInterval(updateResponderLocation, 15000);
    } else if (isCreator) {
      fetchResponderLocation();
      intervalRef.current = setInterval(fetchResponderLocation, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [showResponseMap, activeResponseAlert, isResponder, isCreator, updateResponderLocation, fetchResponderLocation, initialResponderLat, initialResponderLng]);

  // Fit bounds to show both markers
  useEffect(() => {
    if (!mapRef.current || !responderLocation) return;

    const padding = 60;
    const minLng = Math.min(creatorLng, responderLocation.lng);
    const maxLng = Math.max(creatorLng, responderLocation.lng);
    const minLat = Math.min(creatorLat, responderLocation.lat);
    const maxLat = Math.max(creatorLat, responderLocation.lat);

    mapRef.current.fitBounds(
      [[minLng - 0.01, minLat - 0.01], [maxLng + 0.01, maxLat + 0.01]],
      { padding, duration: 1000 }
    );
  }, [responderLocation, creatorLat, creatorLng]);

  if (!showResponseMap || !activeResponseAlert) return null;

  const respLat = responderLocation?.lat || initialResponderLat;
  const respLng = responderLocation?.lng || initialResponderLng;
  const hasResponderLocation = respLat !== 0 && respLng !== 0;
  const hasCreatorLocation = creatorLat !== 0 && creatorLng !== 0;

  const routeCoordinates: [number, number][] =
    hasCreatorLocation && hasResponderLocation
      ? [[respLng, respLat], [creatorLng, creatorLat]]
      : [];

  const centerLng = hasResponderLocation ? (creatorLng + respLng) / 2 : creatorLng;
  const centerLat = hasResponderLocation ? (creatorLat + respLat) / 2 : creatorLat;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl border-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center gap-2">
            <Navigation className="size-5" />
            <div>
              <h3 className="font-semibold text-sm">
                {isResponder ? 'Navigating to Person in Need' : 'Help is on the Way'}
              </h3>
              <p className="text-xs text-emerald-100">
                {isResponder ? 'Head to the location shown below' : 'Someone is coming to help you'}
              </p>
            </div>
          </div>
          <button
            onClick={clearActiveResponseAlert}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close map"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Map */}
        <div className="h-[400px] w-full">
          <Map
            ref={mapRef}
            center={[centerLng, centerLat]}
            zoom={12}
          >
            {/* Alert creator marker (person in need) */}
            {hasCreatorLocation && (
              <MapMarker longitude={creatorLng} latitude={creatorLat}>
                <MarkerContent>
                  <div className="relative">
                    <div className="size-6 rounded-full bg-red-500 border-2 border-white shadow-lg animate-pulse" />
                    <div className="absolute inset-0 size-6 rounded-full bg-red-500/40 animate-ping" />
                  </div>
                  <MarkerLabel position="top" className="text-white font-semibold">
                    Needs Help
                  </MarkerLabel>
                </MarkerContent>
              </MapMarker>
            )}

            {/* Responder marker (person on the way) */}
            {hasResponderLocation && (
              <MapMarker longitude={respLng} latitude={respLat}>
                <MarkerContent>
                  <div className="size-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg" />
                  <MarkerLabel position="top" className="text-white font-semibold">
                    On the Way
                  </MarkerLabel>
                </MarkerContent>
              </MapMarker>
            )}

            {/* Route line between them */}
            {routeCoordinates.length === 2 && (
              <MapRoute
                coordinates={routeCoordinates}
                color="#10b981"
                width={4}
                opacity={0.9}
                dashArray={[8, 4]}
                interactive={false}
              />
            )}
          </Map>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-white border-t">
          <Button
            onClick={clearActiveResponseAlert}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            {isResponder ? "I've Arrived" : 'Close'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
