"use client";

import { useState } from "react";
import { UserPlus, CheckCircle2, Copy, Check } from "lucide-react";
import FormField from "@/components/ui/FormField";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

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
    <div className="modal modal-open">
      <div className="modal-box max-w-md p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
        >
          ✕
        </button>

        <h3 className="font-sans text-base font-semibold mb-1">
          {createdAdmin ? "Admin Provisioned" : "Provision Admin Account"}
        </h3>
        <p className="text-2xs text-base-content/50 mb-4">
          {createdAdmin
            ? "The new administrator account has been created."
            : "Assign administrative permissions with invitation link."}
        </p>

        {error && (
          <div className="mb-4">
            <FeedbackBanner variant="error" message={error} />
          </div>
        )}

        {createdAdmin ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-base-content">
                <p className="font-semibold text-sm">
                  {createdAdmin.firstName} {createdAdmin.lastName} ({createdAdmin.anonymousId})
                </p>
                <p className="text-base-content/70">
                  Assigned role: <span className="font-semibold">ADMIN</span>. An activation email has been queued to{" "}
                  <span className="font-mono text-base-content font-medium">{createdAdmin.email}</span>.
                </p>
              </div>
            </div>

            {activationUrl && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-base-content/70">
                  Direct Activation Link (valid for 48 hours)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activationUrl}
                    className="input input-bordered input-sm font-mono text-2xs w-full bg-base-200/50"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn btn-sm btn-outline btn-primary gap-1.5 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span className="text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-2xs text-base-content/50">
                  You can copy this link if you need to provide it directly to the new administrator.
                </p>
              </div>
            )}

            <div className="modal-action pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-primary btn-sm text-xs cursor-pointer w-full"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First Name" required>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Maria"
                  className="input input-bordered input-sm w-full focus:input-primary text-xs"
                />
              </FormField>
              <FormField label="Last Name" required>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Santos"
                  className="input input-bordered input-sm w-full focus:input-primary text-xs"
                />
              </FormField>
            </div>

            <FormField label="Email Address" required hint="Must be a valid email for account activation.">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="input input-bordered input-sm w-full focus:input-primary text-xs"
              />
            </FormField>

            <FormField label="Contact Info" hint="Optional mobile number or contact details.">
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. 0917-123-4567"
                className="input input-bordered input-sm w-full focus:input-primary text-xs"
              />
            </FormField>

            <div className="p-3 bg-base-200/50 rounded-xl text-2xs text-base-content/70 leading-relaxed border border-base-200">
              <span className="font-semibold text-base-content">Security Notice:</span> The new account will be assigned the standard <span className="font-medium text-primary">ADMIN</span> role. It cannot be granted Super Admin privileges from this form. An activation link will be generated for password setup.
            </div>

            <div className="modal-action pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-sm text-xs cursor-pointer gap-1.5"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Provision Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
