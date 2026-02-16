// ──────────────────────────────────────────────
// Supabase Table Row Types
// ──────────────────────────────────────────────

export interface PanicAlert {
  id: string;
  user_id: string;
  latitude: string;
  longitude: string;
  timestamp: number;
  active: boolean;
  created_at: string;
}

export interface PanicResponse {
  id: string;
  alert_id: string;
  responder_user_id: string;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  subscription: PushSubscriptionJSON;
  created_at: string;
}

export interface LocationRow {
  id: string;
  user_id: string;
  latitude: string;
  longitude: string;
  created_at: string;
}

export interface MoodRow {
  id: string;
  user_id: string;
  mood: string;
  created_at: string;
}
