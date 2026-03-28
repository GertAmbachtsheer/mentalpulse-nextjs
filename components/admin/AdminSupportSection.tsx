"use client";

import { useEffect, useState } from "react";

type SupportOption = {
  id: string;
  title: string;
  description: string | null;
  benefits: string | null;
  price: number;
  type: "monthly" | "once-off";
  sort_order: number | null;
};

const emptyForm = (): Omit<SupportOption, "id"> => ({
  title: "",
  description: "",
  benefits: "",
  price: 0,
  type: "monthly",
  sort_order: null,
});

export function AdminSupportSection() {
  const [items, setItems] = useState<SupportOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSupport();
  }, []);

  async function fetchSupport() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/support");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setItems(data.support ?? []);
    } catch {
      setError("Failed to load support options.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setSaveError("");
    setShowForm(true);
  }

  function openEdit(item: SupportOption) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      benefits: item.benefits ?? "",
      price: item.price,
      type: item.type,
      sort_order: item.sort_order,
    });
    setSaveError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setSaveError("Title is required.");
      return;
    }
    if (form.price < 0) {
      setSaveError("Price must be a positive number.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const body = editingId
        ? { id: editingId, ...form }
        : form;

      const res = await fetch("/api/admin/support", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? "Failed to save.");
        return;
      }

      await fetchSupport();
      closeForm();
    } catch {
      setSaveError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/support", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return;
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const monthly = items.filter((i) => i.type === "monthly");
  const onceOff = items.filter((i) => i.type === "once-off");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {items.length} option{items.length !== 1 ? "s" : ""} total
        </p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b6cee] text-white text-xs font-medium hover:bg-[#1c50b4] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Option
        </button>
      </div>

      {loading && (
        <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <SupportGroup
            label="Monthly"
            items={monthly}
            onEdit={openEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          <SupportGroup
            label="Once-off"
            items={onceOff}
            onEdit={openEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          {items.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">
              No support options yet. Add one above.
            </p>
          )}
        </>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {editingId ? "Edit Support Option" : "New Support Option"}
              </h3>
              <button
                onClick={closeForm}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Title *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-base"
                  placeholder="e.g. Supporter"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Type *">
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as "monthly" | "once-off" })
                    }
                    className="input-base"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="once-off">Once-off</option>
                  </select>
                </Field>

                <Field label="Price (R) *">
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="input-base"
                    placeholder="50"
                  />
                </Field>
              </div>

              <Field label="Sort Order">
                <input
                  type="number"
                  min={0}
                  value={form.sort_order ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sort_order: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="input-base"
                  placeholder="1"
                />
              </Field>

              <Field label="Description">
                <input
                  type="text"
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-base"
                  placeholder="Short description shown to users"
                />
              </Field>

              <Field label="Benefits (HTML)">
                <textarea
                  rows={4}
                  value={form.benefits ?? ""}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  className="input-base resize-none font-mono text-xs"
                  placeholder="<ul><li>Benefit one</li></ul>"
                />
              </Field>
            </div>

            {saveError && (
              <p className="text-xs text-red-500">{saveError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={closeForm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#2b6cee] text-white hover:bg-[#1c50b4] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 0.4rem 0.6rem;
          font-size: 0.8rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus {
          border-color: #2b6cee;
        }
        :global(.dark) .input-base {
          border-color: #334155;
          background: #1e293b;
          color: #f1f5f9;
        }
      `}</style>
    </div>
  );
}

function SupportGroup({
  label,
  items,
  onEdit,
  onDelete,
  deletingId,
}: {
  label: string;
  items: SupportOption[];
  onEdit: (item: SupportOption) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {item.title}
              </p>
              {item.description && (
                <p className="text-xs text-slate-400 truncate mt-0.5">{item.description}</p>
              )}
            </div>
            <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
              R{item.price}
            </span>
            {item.sort_order != null && (
              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                #{item.sort_order}
              </span>
            )}
            <button
              onClick={() => onEdit(item)}
              className="shrink-0 text-slate-400 hover:text-[#2b6cee] transition-colors"
              title="Edit"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button
              onClick={() => onDelete(item.id)}
              disabled={deletingId === item.id}
              className="shrink-0 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
              title="Delete"
            >
              <span className="material-symbols-outlined text-[18px]">
                {deletingId === item.id ? "hourglass_empty" : "delete"}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
