"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Map, MapMarker, MarkerLabel, MarkerContent, MapRef } from "@/components/ui/map";
import { useUser } from "@clerk/nextjs";
import { getUserLocation, upsertLocation } from "@/lib/supabaseCalls";
import { useLocationStore } from "@/store/locationStore";

export default function ProfileLocationToggleCard() {
  const { user } = useUser();
  const { isLocationEnabled, setLocationEnabled } = useLocationStore();
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<string>('');
  const mapRef = useRef<MapRef>(null);
  const [userLocationData, setUserLocationData] = useState<any>(null);

  const fetchUserLocation = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getUserLocation(user.id);
      setUserLocationData(data);
    } catch (err) {
      console.error("Error fetching location:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);

  useEffect(() => {
    if (userLocationData) {
      setLocation(userLocationData);
    }
  }, [userLocationData]);

  useEffect(() => {
    if (location && user?.id) {
      if (
        userLocationData?.longitude === location.longitude?.toString() &&
        userLocationData?.latitude === location.latitude?.toString()
      ) return;
      upsertLocation({
        id: userLocationData?.id,
        userId: user.id,
        latitude: location.latitude?.toString(),
        longitude: location.longitude?.toString(),
      })
        .then(() => fetchUserLocation())
        .catch((err) => console.error("Error saving location:", err));
      mapRef.current?.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 13,
      });
    }
  }, [location]);

  useEffect(() => {
    if (!navigator.permissions?.query) {
      setLocationPermission(navigator.geolocation ? 'available' : 'unavailable');
      return;
    }
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      setLocationPermission(result.state);
      result.addEventListener('change', () => setLocationPermission(result.state));
    });
  }, []);

  // Auto-fetch location whenever location services are enabled
  useEffect(() => {
    if (!isLocationEnabled) return;
    if (locationPermission === 'denied') {
      toast.error("Location access denied", {
        description: "Please allow location access in your browser settings.",
        position: "top-center",
        duration: 3000,
      });
      setLocationEnabled(false);
      return;
    }
    if (locationPermission === '' || locationPermission === 'unavailable') return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        toast.error(err.message, { position: "top-center", duration: 2000 });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [isLocationEnabled, locationPermission]);

  if (!isLocationEnabled || !location) return null;

  return (
    <div className="mx-4 mb-4 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-gray-800">
      <div className="flex flex-col gap-3">
        {loading && (
          <p className="text-xs text-text-sub dark:text-slate-400 px-1">Acquiring location…</p>
        )}
        <div className="rounded-xl overflow-hidden h-55 border border-slate-200 dark:border-gray-700">
          <Map ref={mapRef} center={[location.longitude, location.latitude]} zoom={13}>
            <MapMarker longitude={location.longitude} latitude={location.latitude}>
              <MarkerContent>
                <div className="size-5 rounded-full bg-rose-500 border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
                <MarkerLabel position="top" className="text-white">Me</MarkerLabel>
              </MarkerContent>
            </MapMarker>
          </Map>
        </div>
        <p className="text-xs text-text-sub dark:text-slate-400 px-1">
          Your location is encrypted and only used in the case of an emergency.
        </p>
      </div>
    </div>
  );
}
