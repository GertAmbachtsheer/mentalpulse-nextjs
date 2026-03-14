import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerLabel,
} from "@/components/ui/map";

type PanicAlert = {
  id: string;
  user_id: string;
  latitude: string;
  longitude: string;
  active: boolean;
  timestamp: number;
  created_at: string;
  respondee?: string | null;
};

interface AdminAlertsSectionProps {
  alerts: PanicAlert[];
  alertsLoading: boolean;
  alertsError: string;
  showLocationModal: boolean;
  selectedAlert: PanicAlert | null;
  onOpenLocation: (alert: PanicAlert) => void;
  onCloseLocation: () => void;
}

export function AdminAlertsSection({
  alerts,
  alertsLoading,
  alertsError,
  showLocationModal,
  selectedAlert,
  onOpenLocation,
  onCloseLocation,
}: AdminAlertsSectionProps) {
  return (
    <>
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
              <span>ID</span>
              <span>User</span>
              <span>Status</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-5 md:items-center md:gap-3 text-xs"
                >
                  <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {a.id}
                  </div>
                  <div className="text-slate-800 dark:text-slate-100">
                    <span className="font-mono text-[11px]">{a.user_id}</span>
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
                    {a.respondee && (
                      <span className="hidden md:inline text-[10px] text-slate-500 dark:text-slate-400">
                        Responder: {a.respondee}
                      </span>
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
                        <span className="material-symbols-outlined text-[14px]">
                          location_on
                        </span>
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

      {showLocationModal && selectedAlert && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl h-[70vh] rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden">
            <button
              type="button"
              onClick={onCloseLocation}
              className="absolute right-3 top-3 z-10 text-slate-400 hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>

            <div className="px-5 pt-4 pb-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Alert location
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Visual map view of the panic alert position.
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <Map
                center={[
                  parseFloat(selectedAlert.longitude),
                  parseFloat(selectedAlert.latitude),
                ]}
                zoom={13}
              >
                <MapMarker
                  longitude={parseFloat(selectedAlert.longitude)}
                  latitude={parseFloat(selectedAlert.latitude)}
                >
                  <MarkerContent>
                    <div className="relative">
                      <div className="size-6 rounded-full bg-red-500 border-2 border-white shadow-lg animate-pulse" />
                      <div className="absolute inset-0 size-6 rounded-full bg-red-500/40 animate-ping" />
                    </div>
                    <MarkerLabel
                      position="top"
                      className="text-white font-semibold"
                    >
                      Panic alert
                    </MarkerLabel>
                  </MarkerContent>
                </MapMarker>
              </Map>
            </div>

            <div className="px-5 py-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <span>
                Lat:{" "}
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {selectedAlert.latitude}
                </span>{" "}
                · Lng:{" "}
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {selectedAlert.longitude}
                </span>
              </span>
              <button
                type="button"
                onClick={onCloseLocation}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

