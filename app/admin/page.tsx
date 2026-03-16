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

  const [activeSection, setActiveSection] = useState<"dashboard" | "users" | "moods" | "alerts" | "notifications">("dashboard");

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

  // SSE subscription for real-time alert updates
  useEffect(() => {
    const es = new EventSource("/api/admin/alerts/stream");

    es.addEventListener("alert:triggered", (e) => {
      const newAlert: PanicAlert = JSON.parse(e.data);
      setAlerts((prev) => {
        const exists = prev.some((a) => a.id === newAlert.id);
        return exists ? prev : [newAlert, ...prev];
      });
    });

    es.addEventListener("alert:cancelled", (e) => {
      const { alertId } = JSON.parse(e.data);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, active: false } : a))
      );
    });

    es.addEventListener("alert:responded", (e) => {
      const patch = JSON.parse(e.data);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === patch.alertId
            ? {
                ...a,
                active: false,
                respondee: patch.respondee,
                respondee_first_name: patch.respondee_first_name,
                respondee_last_name: patch.respondee_last_name,
              }
            : a
        )
      );
    });

    return () => es.close();
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
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  {activeSection === "dashboard" && "Overview of current activity."}
                  {activeSection === "users" && "View and manage registered users."}
                  {activeSection === "moods" && "Coming soon: review mood data and trends."}
                  {activeSection === "alerts" && "Review all panic alerts raised in the app."}
                  {activeSection === "notifications" && "Coming soon: manage push and in-app notifications."}
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

