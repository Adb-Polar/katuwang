// Read-only release check: verify the exact reviewed mappings before serving traffic.
import { readFileSync, existsSync } from "node:fs";
import mariadb from "mariadb";

const data = JSON.parse(readFileSync(new URL("../src/lib/approvedSubjectCatalog.json", import.meta.url), "utf8"));
const url = new URL(process.env.DATABASE_URL);
const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
let ca = process.env.AIVEN_CA_CERT || process.env.DATABASE_CA_CERT || process.env.DB_CA_CERT;
ca = ca?.replace(/\\n/g, "\n");
if (ca && !ca.includes("BEGIN CERTIFICATE") && existsSync(ca)) ca = readFileSync(ca, "utf8");
const connection = await mariadb.createConnection({
  host: url.hostname, port: Number(url.port || 3306),
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.slice(1)), connectTimeout: 10000,
  ssl: local ? undefined : { ...(ca?.includes("BEGIN CERTIFICATE") ? { ca } : {}), rejectUnauthorized: true },
});
const json = (value) => typeof value === "string" ? JSON.parse(value) : value;
try {
  const subjects = await connection.query("SELECT slug, gradeLevels, curriculum FROM subjects WHERE active=true");
  const topics = await connection.query("SELECT s.slug, t.name, t.gradeLevels, t.curriculum FROM topics t JOIN subjects s ON s.id=t.subjectId WHERE s.active=true AND t.active=true");
  let subjectCount = 0, topicCount = 0;
  const verify = (row, expected, label) => {
    if (!row || JSON.stringify(json(row.gradeLevels)) !== JSON.stringify(expected.gradeLevels) || json(row.curriculum)?.status !== expected.status) {
      throw new Error(`Reviewed curriculum coverage does not match: ${label}`);
    }
  };
  if (subjects.length !== data.length) throw new Error("The active subject dropdown does not match the approved grouping.");
  for (const mapping of data) {
    const slug = mapping.slug;
    verify(subjects.find((s) => s.slug === slug), { gradeLevels: mapping.gradeLevels, status: mapping.curriculum.status }, slug); subjectCount++;
    for (const expected of mapping.topics) {
      verify(topics.find((t) => t.slug === slug && t.name === expected.name), { gradeLevels: expected.gradeLevels, status: expected.curriculum.status }, `${slug}: ${expected.name}`); topicCount++;
    }
  }
  if (topics.length !== topicCount) throw new Error("Unexpected topics remain active in the approved catalog.");
  console.log(`Curriculum verification passed: ${subjectCount} active general subjects and ${topicCount} approved topics; source evidence and grade arrays match.`);
} finally { await connection.end(); }
