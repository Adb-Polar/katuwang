// ─── Message normalisation for the intent classifier ──────────────────────
// Lowercase, strip accents + punctuation, split on whitespace, drop stopwords,
// then fold common Taglish / spelling variants to canonical tokens so the
// keyword lists in intents.ts stay short.

const STOPWORDS = new Set([
  // English
  "a", "an", "the", "is", "are", "am", "be", "to", "of", "in", "on", "at", "for",
  "and", "or", "i", "you", "me", "my", "we", "it", "this", "that", "do", "does",
  "can", "could", "would", "should", "will", "please", "hey", "hi", "hello",
  "there", "with", "as", "if", "so", "but", "yes", "ok", "okay",
  // "no" / "not" are kept — they carry meaning here ("no class", "no match").
  // Filipino / Taglish fillers + verb affixes
  "ang", "ng", "sa", "na", "ko", "mo", "po", "ba", "yung", "ung", "ito", "iyan",
  "ay", "at", "o", "kung", "may", "meron", "din", "rin", "lang", "naman",
  "mag", "nag", "pag", "maka", "gusto", "pwede", "puwede", "pwedeng",
]);

/** paano -> how, guro -> tutor, etc. Applied token-by-token after tokenising. */
const SYNONYMS: Record<string, string> = {
  // question words
  paano: "how",
  pano: "how",
  saan: "where",
  ano: "what",
  bakit: "why",
  kailan: "when",
  // domain nouns
  guro: "tutor",
  tutor: "tutor",
  titser: "tutor",
  teacher: "tutor",
  klase: "class",
  klaseng: "class",
  session: "class",
  aral: "class",
  leksyon: "class",
  lesson: "class",
  estudyante: "learner",
  student: "learner",
  learner: "learner",
  tutee: "learner",
  libre: "free",
  bayad: "payment",
  presyo: "payment",
  // verbs
  magpatala: "enroll",
  patala: "enroll",
  sumali: "enroll",
  sali: "enroll",
  join: "enroll",
  enroll: "enroll",
  register: "register",
  magparehistro: "register",
  umalis: "leave",
  drop: "leave",
  unenroll: "leave",
  iskedyul: "schedule",
  eskedyul: "schedule",
  oras: "schedule",
  // features
  password: "password",
  pasword: "password",
  notification: "notification",
  abiso: "notification",
  profile: "profile",
  propayl: "profile",
  certified: "certify",
  certification: "certify",
  sertipiko: "certify",
  assessment: "assessment",
  exam: "assessment",
  pagsusulit: "assessment",
  quiz: "assessment",
  match: "match",
  matching: "match",
  tugma: "match",
  recommend: "recommend",
  suggestion: "recommend",
  suggest: "recommend",
  hanap: "find",
  find: "find",
  request: "request",
  hiling: "request",
  anonymous: "anonymous",
  anonymity: "anonymous",
};

// U+0300–U+036F: combining diacritical marks, left over after NFD decomposition.
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");
const NON_TOKEN = /[^a-z0-9\s-]/g;

/** Very light English plural -> singular so keyword lists can stay singular. */
function singularize(t: string): string {
  if (t.length <= 3 || t.endsWith("ss")) return t;
  if (t.endsWith("ies")) return t.slice(0, -3) + "y";
  if (t.endsWith("es") && t.length > 4) return t.slice(0, -2);
  if (t.endsWith("s")) return t.slice(0, -1);
  return t;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(NON_TOKEN, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t))
    .map(singularize)
    .map((t) => SYNONYMS[t] ?? t)
    .filter((t) => !STOPWORDS.has(t));
}
