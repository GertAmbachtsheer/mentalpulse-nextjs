import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Haversine formula to calculate distance between two coordinates in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Trigger a panic alert
export const triggerPanicAlert = mutation({
  args: {
    userId: v.string(),
    latitude: v.string(),
    longitude: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Create the panic alert
    const alertId = await ctx.db.insert("panicAlerts", {
      userId: args.userId,
      latitude: args.latitude,
      longitude: args.longitude,
      timestamp,
      active: true,
    });
    
    return alertId;
  },
});

// Get all active panic alerts
export const getActivePanicAlerts = query({
  handler: async (ctx) => {
    const alerts = await ctx.db
      .query("panicAlerts")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc")
      .collect();
    
    return alerts;
  },
});

// Get nearby users within a specified radius (default 20km)
export const getNearbyUsers = query({
  args: {
    latitude: v.string(),
    longitude: v.string(),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radius = args.radiusKm || 20;
    const userLat = parseFloat(args.latitude);
    const userLon = parseFloat(args.longitude);
    
    // Get all locations
    const allLocations = await ctx.db.query("locations").collect();
    
    // Filter locations within radius
    const nearbyUsers = allLocations.filter((location) => {
      const locLat = parseFloat(location.latitude);
      const locLon = parseFloat(location.longitude);
      
      const distance = calculateDistance(userLat, userLon, locLat, locLon);
      return distance <= radius;
    });
    
    return nearbyUsers.map((location) => ({
      userId: location.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      distance: calculateDistance(
        userLat,
        userLon,
        parseFloat(location.latitude),
        parseFloat(location.longitude)
      ),
    }));
  },
});

// Get user's active panic alert
export const getUserActivePanicAlert = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const activeAlert = await ctx.db
      .query("panicAlerts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    
    return activeAlert;
  },
});

// Dismiss a panic alert
export const dismissPanicAlert = mutation({
  args: {
    alertId: v.id("panicAlerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    await ctx.db.patch(args.alertId, {
      active: false,
    });
    
    return true;
  },
});

// Get panic alerts relevant to a user (within 40km)
export const getRelevantPanicAlerts = query({
  args: {
    alertId: v.string(),
    userId: v.string(),
    latitude: v.string(),
    longitude: v.string(),
  },
  handler: async (ctx, args) => {
    const userLat = parseFloat(args.latitude);
    const userLon = parseFloat(args.longitude);
    
    // Get all active alerts
    const activeAlerts = await ctx.db
      .query("panicAlerts")
      .withIndex("by_active", (q) => q.eq("active", true))
      .filter((q) => q.eq(q.field("_id"), args.alertId))
      .collect();

    // Filter alerts within 40km and not from the current user
    const relevantAlerts = activeAlerts
      .filter((alert) => {
        if (alert.userId === args.userId) return false;
        
        const alertLat = parseFloat(alert.latitude);
        const alertLon = parseFloat(alert.longitude);
        
        const distance = calculateDistance(userLat, userLon, alertLat, alertLon);
        return distance <= 40;
      })
      .map((alert) => ({
        ...alert,
        distance: calculateDistance(
          userLat,
          userLon,
          parseFloat(alert.latitude),
          parseFloat(alert.longitude)
        ),
      }));
    
    return relevantAlerts;
  },
});
