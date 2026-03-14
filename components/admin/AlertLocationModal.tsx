import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerLabel,
} from "@/components/ui/map";

type PanicAlert = {
  id: string;
  latitude: string;
  longitude: string;
};

interface AlertLocationModalProps {
  alert: PanicAlert;
  onClose: () => void;
}

export function AlertLocationModal({ alert, onClose }: AlertLocationModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl h-[70vh] rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 text-slate-400 hover:text-slate-200"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
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
            center={[parseFloat(alert.longitude), parseFloat(alert.latitude)]}
            zoom={13}
          >
            <MapMarker
              longitude={parseFloat(alert.longitude)}
              latitude={parseFloat(alert.latitude)}
            >
              <MarkerContent>
                <div className="relative">
                  <div className="size-6 rounded-full bg-red-500 border-2 border-white shadow-lg animate-pulse" />
                  <div className="absolute inset-0 size-6 rounded-full bg-red-500/40 animate-ping" />
                </div>
                <MarkerLabel position="top" className="text-white font-semibold">
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
              {alert.latitude}
            </span>{" "}
            · Lng:{" "}
            <span className="font-mono text-slate-700 dark:text-slate-200">
              {alert.longitude}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
