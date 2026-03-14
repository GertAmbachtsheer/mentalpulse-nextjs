type PanicAlert = {
  id: string;
  user_id: string;
  user_first_name?: string | null;
  user_last_name?: string | null;
  latitude: string;
  longitude: string;
  active: boolean;
  timestamp: number;
  created_at: string;
  respondee?: string | null;
  respondee_first_name?: string | null;
  respondee_last_name?: string | null;
};

interface AdminAlertsSectionProps {
  alerts: PanicAlert[];
  alertsLoading: boolean;
  alertsError: string;
  onOpenLocation: (alert: PanicAlert) => void;
}

export function AdminAlertsSection({
  alerts,
  alertsLoading,
  alertsError,
  onOpenLocation,
}: AdminAlertsSectionProps) {
  return (
    <section className="max-w-5xl mx-auto">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-3">
        Panic Alerts
      </h3>

      {alertsLoading && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-500 dark:text-slate-400">
          Loading alerts…
        </div>
      )}

      {alertsError && !alertsLoading && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
          {alertsError}
        </div>
      )}

      {!alertsLoading && !alertsError && alerts.length === 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-500 dark:text-slate-400">
          No panic alerts found.
        </div>
      )}

      {!alertsLoading && !alertsError && alerts.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 overflow-hidden">
          <div className="hidden md:grid grid-cols-5 gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <span>User</span>
            <span>Status</span>
            <span>Responder</span>
            <span>Created</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-5 md:items-center md:gap-3 text-xs"
              >
                <div className="text-slate-800 dark:text-slate-100">
                  {a.user_first_name ? (
                    <span className="text-[12px] font-medium">
                      {[a.user_first_name, a.user_last_name].filter(Boolean).join(" ")}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{a.user_id}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                      a.active
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {a.active ? "Active" : "Resolved"}
                  </span>
                </div>
                <div className="text-slate-800 dark:text-slate-100">
                  {a.respondee_first_name ? (
                    <span className="text-[12px] font-medium">
                      {[a.respondee_first_name, a.respondee_last_name].filter(Boolean).join(" ")}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">—</span>
                  )}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {new Date(a.created_at).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  {a.active ? (
                    <button
                      type="button"
                      onClick={() => onOpenLocation(a)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span>View location</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
