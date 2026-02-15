"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { getUserLocation, upsertLocation } from "@/lib/supabaseCalls";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PanicButton from "./PanicButton";
import { useLocationStore } from "@/store/locationStore";

export default function LocationToggleCard() {
  const { user } = useUser();
  const { isLocationEnabled, isTracking, setLocationEnabled, setTracking } = useLocationStore();
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<string>('');
  const [userLocationData, setUserLocationData] = useState<any>(null);

  // Fetch user location from Supabase
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
      getLocation();
    }
  }, [userLocationData]);

  useEffect(() => {
    if (location && user?.id) {
      if (userLocationData?.longitude === location.longitude.toString() && userLocationData?.latitude === location.latitude.toString()) return;
      upsertLocation({
        id: userLocationData?.id,
        userId: user.id,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      }).then(() => fetchUserLocation()).catch(err => console.error("Error saving location:", err));
    }
  }, [location]);
  
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      });
    } else {
      if (navigator.geolocation) {
        setLocationPermission('available');
      } else {
        toast.error("Geolocation is not supported by your browser", {
          position: "top-center",
          duration: 2000,
        });
        setLocationPermission('unavailable');
        return;
      }
    }
  }, [locationPermission]);

  const getLocation = () => {
    if (locationPermission === '') return;
    setLoading(true);
    if (locationPermission === 'denied') {
      toast.error("Location access denied", {
        description: "Please allow location access to enable location-based features.",
        position: "top-center",
        duration: 2000,
      });
      setLoading(false);
      return;
    }

    if (!isLocationEnabled && locationPermission !== 'granted') {
      toast.warning("Please allow location access to enable location-based features.",{
        position: "top-center",
        duration: 2000,
      });
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLoading(false);
      },
      (err) => {
        toast.error(err.message, 
          {
            position: "top-center",
            duration: 2000,
          })
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  }

  const handleToggleLocation = () => {
    setLocationEnabled(!isLocationEnabled);
    if (!isLocationEnabled) {
      setTimeout(() => {
        navigator.geolocation.getCurrentPosition((position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        })
      }, 200);
    }
  };

  return (
    (isLocationEnabled && isTracking) ?
      <PanicButton /> :
    <Card className="mx-2 mt-2 mb-1 bg-white rounded-xl px-6 py-2 shadow-sm border border-border/80">
      <Accordion
        type="single"
        collapsible
      >
        <AccordionItem value="location">
          <AccordionTrigger className="no-underline hover:no-underline"><div className="flex items-center gap-2">Location Services 
            {isLocationEnabled && isTracking ? <Badge variant="default">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</div></AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Enable Location Access</p>
                  <p className="text-sm text-muted-foreground">
                    Allow access to your location for location-based features.
                  </p>
                </div>
                <Switch
                  checked={isLocationEnabled}
                  onCheckedChange={handleToggleLocation}
                  aria-label="Toggle location access"
                />
              </div>

              {isLocationEnabled && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Your location data is encrypted and only used in the case of an emergency.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}