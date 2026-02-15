import { supabase } from './supabase'

// ──────────────────────────────────────────────
// Moods
// ──────────────────────────────────────────────

export async function getMoods(userId: string) {
  const { data, error } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(14)

  if (error) throw error
  return data
}

export async function getRecentUserMood(userId: string) {
  const { data, error } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertMood({
  id,
  userId,
  mood,
  sameDay,
}: {
  id?: string
  userId: string
  mood: string
  sameDay: boolean
}) {
  if (sameDay && id) {
    const { data, error } = await supabase
      .from('moods')
      .update({ mood })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('moods')
      .insert({ user_id: userId, mood })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ──────────────────────────────────────────────
// Locations
// ──────────────────────────────────────────────

export async function getUserLocation(userId: string) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertLocation({
  id,
  userId,
  longitude,
  latitude,
}: {
  id?: string
  userId: string
  longitude: string
  latitude: string
}) {
  if (id) {
    const { data, error } = await supabase
      .from('locations')
      .update({ longitude, latitude })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('locations')
      .insert({ user_id: userId, longitude, latitude })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ──────────────────────────────────────────────
// Support
// ──────────────────────────────────────────────

export async function getSupport() {
  const { data, error } = await supabase
    .from('support')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Panic Alerts
// ──────────────────────────────────────────────

export async function triggerPanicAlert({
  userId,
  latitude,
  longitude,
}: {
  userId: string
  latitude: string
  longitude: string
}) {
  const timestamp = Date.now()

  const { data, error } = await supabase
    .from('panic_alerts')
    .insert({
      user_id: userId,
      latitude,
      longitude,
      timestamp,
      active: true,
    })
    .select()
    .single()

  if (error) throw error
  return data.id
}

export async function getActivePanicAlerts() {
  const { data, error } = await supabase
    .from('panic_alerts')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getUserActivePanicAlert(userId: string) {
  const { data, error } = await supabase
    .from('panic_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function dismissPanicAlert(alertId: string) {
  const { error } = await supabase
    .from('panic_alerts')
    .update({ active: false })
    .eq('id', alertId)

  if (error) throw error
  return true
}

// Haversine formula to calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 6371 // Earth's radius in km

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function getNearbyUsers({
  latitude,
  longitude,
  radiusKm = 20,
}: {
  latitude: string
  longitude: string
  radiusKm?: number
}) {
  const userLat = parseFloat(latitude)
  const userLon = parseFloat(longitude)

  const { data: allLocations, error } = await supabase
    .from('locations')
    .select('*')

  if (error) throw error

  const nearbyUsers = (allLocations || [])
    .filter((location) => {
      const locLat = parseFloat(location.latitude)
      const locLon = parseFloat(location.longitude)
      const distance = calculateDistance(userLat, userLon, locLat, locLon)
      return distance <= radiusKm
    })
    .map((location) => ({
      userId: location.user_id,
      latitude: location.latitude,
      longitude: location.longitude,
      distance: calculateDistance(
        userLat,
        userLon,
        parseFloat(location.latitude),
        parseFloat(location.longitude)
      ),
    }))

  return nearbyUsers
}

export async function getRelevantPanicAlerts({
  alertId,
  userId,
  latitude,
  longitude,
}: {
  alertId: string
  userId: string
  latitude: string
  longitude: string
}) {
  const userLat = parseFloat(latitude)
  const userLon = parseFloat(longitude)

  const { data: activeAlerts, error } = await supabase
    .from('panic_alerts')
    .select('*')
    .eq('active', true)
    .eq('id', alertId)

  if (error) throw error

  const relevantAlerts = (activeAlerts || [])
    .filter((alert) => {
      if (alert.user_id === userId) return false

      const alertLat = parseFloat(alert.latitude)
      const alertLon = parseFloat(alert.longitude)
      const distance = calculateDistance(userLat, userLon, alertLat, alertLon)
      return distance <= 40
    })
    .map((alert) => ({
      ...alert,
      distance: calculateDistance(
        userLat,
        userLon,
        parseFloat(alert.latitude),
        parseFloat(alert.longitude)
      ),
    }))

  return relevantAlerts
}