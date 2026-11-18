"use client";

import { useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import FormField from "@/components/ui/FormField";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Modal from "@/components/ui/Modal";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminCreated: () => void;
}

interface CreatedAdminData {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function CreateAdminModal({
  isOpen,
  onClose,
  onAdminCreated,
}: CreateAdminModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAdmin, setCreatedAdmin] = useState<CreatedAdminData | null>(null);
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setContactInfo("");
    setError(null);
    setCreatedAdmin(null);
    setActivationUrl(null);
    setCopied(false);
  };

  const handleClose = () => {
    const wasCreated = !!createdAdmin;
    handleReset();
    onClose();
    if (wasCreated) {
      onAdminCreated();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          contactInfo: contactInfo.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create admin account.");
      }

      setCreatedAdmin(data.admin);
      setActivationUrl(data.activationUrl || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!activationUrl) return;
    try {
      await navigator.clipboard.writeText(activationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy activation URL:", err);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title={createdAdmin ? "Admin account created" : "Create admin account"} size="md">
        <p className="text-sm text-(--kt-muted) mb-4">
          {createdAdmin
            ? "The new administrator account has been created."
            : "The new admin sets their own password from an activation link."}
        </p>

        {error && (
          <div className="mb-4">
            <FeedbackBanner variant="error" message={error} />
          </div>
        )}

        {createdAdmin ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-semibold">
                {createdAdmin.firstName} {createdAdmin.lastName} ({createdAdmin.anonymousId})
              </p>
              <p className="text-sm text-(--kt-muted)">
                Role: admin. An activation email has been queued to{" "}
                <span className="text-base-content font-medium break-all">{createdAdmin.email}</span>.
              </p>
            </div>

            {activationUrl && (
              <div className="space-y-1.5">
                <label htmlFor="admin-activation-url" className="text-[0.9rem] font-medium text-base-content">
                  Activation link (valid for 48 hours)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="admin-activation-url"
                    type="text"
                    readOnly
                    value={activationUrl}
                    className="input input-bordered font-mono text-sm w-full"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn btn-outline btn-primary gap-1.5 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-success" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-(--kt-muted)">
                  Copy this link if you need to give it to the new administrator directly.
                </p>
              </div>
            )}

            <div className="modal-action pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="First name" required size="md">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Maria"
                  className="input input-bordered w-full focus:input-primary"
                />
              </FormField>
              <FormField label="Last name" required size="md">
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Santos"
                  className="input input-bordered w-full focus:input-primary"
                />
              </FormField>
            </div>

            <FormField label="Email address" required hint="Must be a valid email for account activation." size="md">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="input input-bordered w-full focus:input-primary"
              />
            </FormField>

            <FormField label="Contact info" hint="Optional mobile number or contact details." size="md">
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. 0917-123-4567"
                className="input input-bordered w-full focus:input-primary"
              />
            </FormField>

            <p className="text-sm text-(--kt-muted)">
              The new account gets the standard admin role. Super admin access can&apos;t be granted from this form.
            </p>

            <div className="modal-action pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary gap-2"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
    </Modal>
  );
}
