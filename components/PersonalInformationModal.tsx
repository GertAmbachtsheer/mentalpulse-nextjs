"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  EmergencyContact,
} from "@/lib/supabaseCalls";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "name" | "password" | "contacts";

export default function PersonalInformationModal({ open, onClose }: Props) {
  const { user } = useUser();

  // Name
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [savingName, setSavingName] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Emergency contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [addingContact, setAddingContact] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("name");

  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync name fields when user loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  // Load emergency contacts when tab is opened
  useEffect(() => {
    if (open && activeTab === "contacts" && user) {
      fetchContacts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, user]);

  async function fetchContacts() {
    if (!user) return;
    setLoadingContacts(true);
    try {
      const data = await getEmergencyContacts(user.id);
      setContacts(data);
    } catch {
      toast.error("Failed to load emergency contacts");
    } finally {
      setLoadingContacts(false);
    }
  }

  async function handleSaveName() {
    if (!user) return;
    setSavingName(true);
    try {
      await user.update({ firstName, lastName });
      toast.success("Name updated successfully");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePassword() {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await user.updatePassword({ currentPassword, newPassword });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.errors?.[0]?.message ?? "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAddContact() {
    if (!user) return;
    if (!contactName.trim() || !contactPhone.trim()) {
      toast.error("Please enter both a name and phone number");
      return;
    }
    setAddingContact(true);
    try {
      const newContact = await addEmergencyContact(user.id, contactName.trim(), contactPhone.trim());
      setContacts((prev) => [...prev, newContact]);
      setContactName("");
      setContactPhone("");
      toast.success("Emergency contact added");
    } catch {
      toast.error("Failed to add emergency contact");
    } finally {
      setAddingContact(false);
    }
  }

  async function handleDeleteContact(id: string) {
    try {
      await deleteEmergencyContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Contact removed");
    } catch {
      toast.error("Failed to remove contact");
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-background-light dark:bg-background-dark rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-text-main dark:text-white">Personal Information</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-text-sub dark:text-slate-400"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-4 gap-2">
          {(["name", "password", "contacts"] as Tab[]).map((tab) => {
            const labels: Record<Tab, string> = {
              name: "Name",
              password: "Password",
              contacts: "Emergency",
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "bg-slate-100 dark:bg-gray-800 text-text-sub dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 no-scrollbar">
          {/* ── Name Tab ── */}
          {activeTab === "name" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-sub dark:text-slate-400">Update your display name.</p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-sub dark:text-slate-400 uppercase tracking-wider">
                  First Name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-text-main dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="First name"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-sub dark:text-slate-400 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-text-main dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Last name"
                />
              </div>

              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 mt-2"
              >
                {savingName ? "Saving..." : "Save Name"}
              </button>
            </div>
          )}

          {/* ── Password Tab ── */}
          {activeTab === "password" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-sub dark:text-slate-400">Change your account password.</p>

              {[
                { label: "Current Password", value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent((v) => !v) },
                { label: "New Password", value: newPassword, setter: setNewPassword, show: showNew, toggle: () => setShowNew((v) => !v) },
                { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm((v) => !v) },
              ].map(({ label, value, setter, show, toggle }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-sub dark:text-slate-400 uppercase tracking-wider">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-text-main dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub dark:text-slate-400"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {show ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleSavePassword}
                disabled={savingPassword}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 mt-2"
              >
                {savingPassword ? "Saving..." : "Update Password"}
              </button>
            </div>
          )}

          {/* ── Emergency Contacts Tab ── */}
          {activeTab === "contacts" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-sub dark:text-slate-400">
                Add people to contact in case of emergency.
              </p>

              {/* Add contact form */}
              <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 border border-slate-100 dark:border-gray-700">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-sub dark:text-slate-400 uppercase tracking-wider">
                    Contact Name
                  </label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-text-main dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Mom"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-sub dark:text-slate-400 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-text-main dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="+1 555 000 0000"
                  />
                </div>
                <button
                  onClick={handleAddContact}
                  disabled={addingContact}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  {addingContact ? "Adding..." : "Add Contact"}
                </button>
              </div>

              {/* Contact list */}
              {loadingContacts ? (
                <div className="flex justify-center py-6">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                </div>
              ) : contacts.length === 0 ? (
                <p className="text-center text-sm text-text-sub dark:text-slate-500 py-4">
                  No emergency contacts added yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-main dark:text-white">{contact.name}</p>
                          <p className="text-xs text-text-sub dark:text-slate-400">{contact.phone}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom safe area */}
        <div className="h-6" />
      </div>
    </div>
  );
}
