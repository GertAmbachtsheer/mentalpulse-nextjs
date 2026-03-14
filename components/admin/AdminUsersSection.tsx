type AdminUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string;
  createdAt: number;
};

interface AdminUsersSectionProps {
  users: AdminUser[];
  isLoading: boolean;
  error: string;
}

export function AdminUsersSection({
  users,
  isLoading,
  error,
}: AdminUsersSectionProps) {
  return (
    <>
      <section className="mb-6 max-w-5xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-2">
          Overview
        </h3>
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Users
            </p>
            <p className="text-2xl font-bold mt-1">
              {isLoading ? "—" : users.length}
            </p>
          </div>
          <span className="material-symbols-outlined text-[32px] text-[#2b6cee]">
            group
          </span>
        </div>
      </section>

      <section className="mt-4 max-w-5xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-3">
          Users
        </h3>

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-500 dark:text-slate-400">
            Loading users…
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!isLoading && !error && users.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-500 dark:text-slate-400">
            No users found.
          </div>
        )}

        {!isLoading && !error && users.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {u.firstName || u.lastName
                      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                      : u.email ?? "Unknown user"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {u.email || "No email"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                      u.role === "admin"
                        ? "bg-[#2b6cee]/10 text-[#2b6cee]"
                        : "bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {u.role}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ID: {u.id.slice(0, 6)}…
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

