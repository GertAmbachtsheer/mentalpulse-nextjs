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
  user_contact_number?: string | null;
  respondee?: string | null;
  respondee_first_name?: string | null;
  respondee_last_name?: string | null;
};

interface AdminDashboardSectionProps {
  alerts: PanicAlert[];
  alertsLoading: boolean;
  alertsError: string;
  onOpenLocation: (alert: PanicAlert) => void;
}

export function AdminDashboardSection({
  alerts,
  alertsLoading,
  alertsError,
  onOpenLocation,
}: AdminDashboardSectionProps) {
  const activeAlerts = alerts.filter((a) => a.active);

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-3">
          Active Alerts {activeAlerts.length > 0 && `(${activeAlerts.length})`}
        </h3>

        {alertsLoading && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-500 dark:text-slate-400">
            Loading…
          </div>
        )}

        {alertsError && !alertsLoading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
            {alertsError}
          </div>
        )}

        {!alertsLoading && !alertsError && activeAlerts.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-emerald-500">check_circle</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">No active panic alerts right now.</span>
          </div>
        )}

        {!alertsLoading && !alertsError && activeAlerts.length > 0 && (
          <div className="flex flex-col gap-3">
            {activeAlerts.map((activeAlert) => (
              <div key={activeAlert.id} className="rounded-2xl border border-red-500/30 bg-red-500/5 dark:bg-red-500/10 p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2.5 bg-red-500" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">
                      User
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {activeAlert.user_first_name
                        ? [activeAlert.user_first_name, activeAlert.user_last_name].filter(Boolean).join(" ")
                        : <span className="font-mono text-[11px] text-slate-500">{activeAlert.user_id}</span>}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">
                      Contact
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {activeAlert.user_contact_number ? (
                        <a href={`tel:${activeAlert.user_contact_number}`} className="font-medium hover:underline">
                          {activeAlert.user_contact_number}
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">
                      Raised at
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {new Date(activeAlert.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => onOpenLocation(activeAlert)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      View location
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
