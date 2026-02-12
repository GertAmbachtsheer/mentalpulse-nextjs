"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { locationsApi } from "@/lib/convexCalls";
import { useMutation, useQuery } from "convex/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LocationToggleCard() {
  const { user } = useUser();
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<string>('');

  const upsertLocationMutation = useMutation(locationsApi.upsertLocation);
  const userLocationQuery = useQuery(locationsApi.getUserLocation, 
    user?.id ? { userId: user.id } : "skip"
  );

  useEffect(() => {
    if (userLocationQuery) {
      setLocation(userLocationQuery);
      getLocation();
    }
  },[userLocationQuery]);

  useEffect(() => {
    if (location) {
      if (userLocationQuery?.longitude === location.longitude.toString() && userLocationQuery?.latitude === location.latitude.toString()) return;
      upsertLocationMutation({
        id: userLocationQuery?._id,
        userId: user?.id!,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      });
    }
  },[location]);
  
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state); // 'granted', 'prompt', or 'denied'
        // Listen for permission changes
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      });
    } else {
      // Fallback: try to access geolocation directly
      if (navigator.geolocation) {
        setLocationPermission('available'); // API exists but permission unknown
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

    if (locationPermission === 'granted') {
      setIsLocationEnabled(true);
      setIsTracking(true);
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
    setIsLocationEnabled(!isLocationEnabled);
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
    <Card className="mx-2 mt-2 mb-1 bg-white rounded-xl px-6 py-2 shadow-sm border border-border/80">
      <Accordion
        type="single"
        collapsible
      >
        <AccordionItem value="location">
          <AccordionTrigger><div className="flex items-center gap-2">Location Services 
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