// Contact-info format rules, shared by the profile API routes and the client
// edit form. Kept dependency-free so it is safe to import into client bundles.
//
// A learner/tutor contact is either a Philippine mobile number or a free-form
// handle (Messenger name, guardian's name + landline, etc.). Numbers are
// normalised to the local `09XXXXXXXXX` form so admins see one consistent shape.

const PHONE_LIKE = /^[\d\s()+.-]+$/;
const PH_MOBILE = /^(?:\+?63|0)9\d{9}$/;

export function normalizeContactInfo(
  raw: string
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: "" };

  // Looks like someone tried to type a phone number → hold it to the PH format.
  if (PHONE_LIKE.test(trimmed)) {
    const digits = trimmed.replace(/[\s()+.-]/g, "");
    if (!PH_MOBILE.test(digits)) {
      return {
        ok: false,
        error: "Enter a valid Philippine mobile number, e.g. 0917 123 4567.",
      };
    }
    const local = digits.replace(/^(?:\+?63|0)/, "0"); // → 09XXXXXXXXX
    return { ok: true, value: local };
  }

  if (trimmed.length < 3) return { ok: false, error: "Contact info is too short." };
  if (trimmed.length > 200) {
    return { ok: false, error: "Contact info cannot exceed 200 characters." };
  }
  return { ok: true, value: trimmed };
}
