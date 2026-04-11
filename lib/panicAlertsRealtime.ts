/** Stable Realtime channel name for `postgres_changes` on `panic_alerts`. */
export const PANIC_ALERTS_POSTGRES_CHANNEL = "admin-panic-alerts-postgres";

/** Map a `panic_alerts` row from Realtime to admin list shape (enriched name fields null until merged). */
export function panicRowToAlert(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    latitude: String(row.latitude),
    longitude: String(row.longitude),
    active: Boolean(row.active),
    timestamp: Number(row.timestamp),
    created_at: String(row.created_at),
    respondee: row.respondee != null ? String(row.respondee) : null,
    user_first_name: null as string | null,
    user_last_name: null as string | null,
    user_contact_number: null as string | null,
    respondee_first_name: null as string | null,
    respondee_last_name: null as string | null,
  };
}
