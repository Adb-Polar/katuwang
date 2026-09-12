// Contact-info format rules, shared by the profile API routes and the client
// edit form. Kept dependency-free so it is safe to import into client bundles.
//
// A learner/tutor contact is a Philippine mobile number only — no free-form
// handles. Numbers are normalised to the local `09XXXXXXXXX` form so admins
// see one consistent shape.

const PH_MOBILE = /^(?:\+?63|0)9\d{9}$/;

export function normalizeContactInfo(
  raw: string
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: "" };

  const digits = trimmed.replace(/[\s()+.-]/g, "");
  if (!/^\d+$/.test(digits) || !PH_MOBILE.test(digits)) {
    return {
      ok: false,
      error: "Enter a valid Philippine mobile number, e.g. 0917 123 4567.",
    };
  }
  const local = digits.replace(/^(?:\+?63|0)/, "0"); // → 09XXXXXXXXX
  return { ok: true, value: local };
}
