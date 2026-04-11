"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import { AdminUsersSection } from "@/components/admin/AdminUsersSection";
import { AdminAlertsSection } from "@/components/admin/AdminAlertsSection";
import { AdminMoodsSection } from "@/components/admin/AdminMoodsSection";
import { AdminNotificationsSection } from "@/components/admin/AdminNotificationsSection";
import { AdminDashboardSection } from "@/components/admin/AdminDashboardSection";
import { AlertLocationModal } from "@/components/admin/AlertLocationModal";
import { AdminSupportSection } from "@/components/admin/AdminSupportSection";
import { supabaseRealtimeAnon } from "@/lib/supabase-browser-realtime-anon";
import {
  PANIC_ALERTS_POSTGRES_CHANNEL,
  panicRowToAlert,
} from "@/lib/panicAlertsRealtime";

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

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<"dashboard" | "users" | "moods" | "alerts" | "notifications" | "support">("dashboard");

  const [alerts, setAlerts] = useState<PanicAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState("");
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<PanicAlert | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    if (activeSection !== "dashboard" && activeSection !== "alerts") return;
    if (alertsLoaded || alertsLoading) return;

    const loadAlerts = async () => {
      try {
        setAlertsLoading(true);
        setAlertsError("");
        const res = await fetch("/api/admin/alerts");
        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) {
          setAlertsError("Failed to load alerts.");
          setAlertsLoading(false);
          setAlertsLoaded(true);
          return;
        }
        const data = await res.json();
        setAlerts(data.alerts ?? []);
        setAlertsLoading(false);
        setAlertsLoaded(true);
      } catch {
        setAlertsError("Something went wrong while loading alerts.");
        setAlertsLoading(false);
        setAlertsLoaded(true);
      }
    };

    loadAlerts();
  }, [activeSection, alertsLoaded, alertsLoading, router]);

  // Supabase Realtime: DB changes on `panic_alerts` (add table to `supabase_realtime` publication — see sql/enable_panic_alerts_realtime.sql).
  useEffect(() => {
    const channel = supabaseRealtimeAnon.channel(PANIC_ALERTS_POSTGRES_CHANNEL, {
      config: { private: false },
    });

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "panic_alerts" },
      (payload) => {
        const errs = (payload as { errors?: unknown[] }).errors;
        if (Array.isArray(errs) && errs.length > 0) {
          console.error("[panic_alerts realtime]", errs);
          return;
        }

        const eventType = (payload as { eventType: string }).eventType;

        if (eventType === "INSERT") {
          const row = (payload as { new: Record<string, unknown> }).new;
          const incoming = panicRowToAlert(row) as PanicAlert;
          setAlerts((prev) =>
            prev.some((a) => a.id === incoming.id) ? prev : [incoming, ...prev]
          );
          return;
        }

        if (eventType === "UPDATE") {
          const row = (payload as { new: Record<string, unknown> }).new;
          setAlerts((prev) => {
            const id = String(row.id);
            const existing = prev.find((a) => a.id === id);
            const merged = panicRowToAlert(row) as PanicAlert;
            if (existing) {
              merged.user_first_name = existing.user_first_name;
              merged.user_last_name = existing.user_last_name;
              merged.user_contact_number = existing.user_contact_number;
              if (String(row.respondee ?? "") === String(existing.respondee ?? "")) {
                merged.respondee_first_name = existing.respondee_first_name;
                merged.respondee_last_name = existing.respondee_last_name;
              }
            }
            return prev.some((a) => a.id === id)
              ? prev.map((a) => (a.id === id ? merged : a))
              : [merged, ...prev];
          });
          return;
        }

        if (eventType === "DELETE") {
          const oldRow = (payload as { old: Record<string, unknown> }).old;
          const id = String(oldRow.id);
          setAlerts((prev) => prev.filter((a) => a.id !== id));
        }
      }
    );

    channel.subscribe(
      (status, err) => {
        if (status === "SUBSCRIBED") return;
        if (status === "CLOSED") return;
        const hint =
          status === "TIMED_OUT"
            ? "Join exceeded timeout — client uses 60s now; if this persists, check Realtime logs and network."
            : "CHANNEL_ERROR: see sql/enable_panic_alerts_realtime.sql and RLS SELECT for anon on panic_alerts.";
        console.error("[panic_alerts realtime] status:", status, err ?? hint);
      },
      60_000
    );

    return () => {
      void supabaseRealtimeAnon.removeChannel(channel);
    };
  }, []);

  const handleOpenLocation = (alert: PanicAlert) => {
    setSelectedAlert(alert);
    setShowLocationModal(true);
  };

  const handleCloseLocation = () => {
    setShowLocationModal(false);
    setSelectedAlert(null);
  };

  return (
    <AdminGuard>
    <div
      className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="relative flex h-dvh min-h-screen w-full overflow-hidden bg-white dark:bg-background-dark shadow-sm">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-sm">
          <div className="px-6 py-4 border-b border-slate-200/70 dark:border-slate-800">
            <h2 className="text-base font-semibold tracking-[-0.02em]">
              Admin Panel
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Manage users and system data
            </p>
          </div>
          <nav className="flex-1 py-4 space-y-1">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-left transition-colors ${
                activeSection === "dashboard"
                  ? "bg-[#2b6cee]/10 text-[#1c50b4] dark:text-[#86a9ff]"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveSection("users")}
              className={`w-full flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-left transition-colors ${
                activeSection === "users"
                  ? "bg-[#2b6cee]/10 text-[#1c50b4] dark:text-[#86a9ff]"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveSection("moods")}
              className={`w-full flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-left transition-colors ${
                activeSection === "moods"
                  ? "bg-[#2b6cee]/10 text-[#1c50b4] dark:text-[#86a9ff]"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
              <span>Moods</span>
            </button>
            <button
              onClick={() => setActiveSection("alerts")}
              className={`w-full flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-left transition-colors ${
                activeSection === "alerts"
                  ? "bg-[#2b6cee]/10 text-[#1c50b4] dark:text-[#86a9ff]"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>Alerts</span>
            </button>
            <button
              onClick={() => setActiveSection("notifications")}
              className={`w-full flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-left transition-colors ${
                activeSection === "notifications"
                  ? "bg-[#2b6cee]/10 text-[#1c50b4] dark:text-[#86a9ff]"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span>Notifications</span>
            </button>
            <button
              onClick={() => setActiveSection("support")}
              className={`w-full flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-left transition-colors ${
                activeSection === "support"
                  ? "bg-[#2b6cee]/10 text-[#1c50b4] dark:text-[#86a9ff]"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
              <span>Support Options</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex items-center px-4 md:px-6 py-4 justify-between border-b border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="inline-flex md:hidden w-9 h-9 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <span className="material-symbols-outlined text-[20px]">
                  arrow_back
                </span>
              </button>
              <div>
                <h1 className="text-lg font-semibold tracking-[-0.02em]">
                  {activeSection === "dashboard" && "Dashboard"}
                  {activeSection === "users" && "Users"}
                  {activeSection === "moods" && "Moods"}
                  {activeSection === "alerts" && "Alerts"}
                  {activeSection === "notifications" && "Notifications"}
                  {activeSection === "support" && "Support Options"}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  {activeSection === "dashboard" && "Overview of current activity."}
                  {activeSection === "users" && "View and manage registered users."}
                  {activeSection === "moods" && "View mood data and trends."}
                  {activeSection === "alerts" && "Review all panic alerts raised in the app."}
                  {activeSection === "notifications" && "Coming soon: manage push and in-app notifications."}
                  {activeSection === "support" && "Manage helplines, crisis resources, and support options."}
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 no-scrollbar">
            {activeSection === "dashboard" && (
              <AdminDashboardSection
                alerts={alerts}
                alertsLoading={alertsLoading}
                alertsError={alertsError}
                onOpenLocation={handleOpenLocation}
              />
            )}

            {activeSection === "users" && <AdminUsersSection />}

            {activeSection === "alerts" && (
              <AdminAlertsSection
                alerts={alerts}
                alertsLoading={alertsLoading}
                alertsError={alertsError}
                onOpenLocation={handleOpenLocation}
              />
            )}

            {activeSection === "moods" && <AdminMoodsSection />}

            {activeSection === "notifications" && <AdminNotificationsSection />}

            {activeSection === "support" && <AdminSupportSection />}
          </main>
        </div>
      </div>

      {showLocationModal && selectedAlert && (
        <AlertLocationModal alert={selectedAlert} onClose={handleCloseLocation} />
      )}
    </div>
    </AdminGuard>
  );
}

