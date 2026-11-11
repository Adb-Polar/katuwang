// Read-only release check. Administrator disables are valid; unsupported active entries are not.
import { readFileSync, existsSync } from "node:fs";
import mariadb from "mariadb";
import { isDeepStrictEqual } from "node:util";
const data = JSON.parse(readFileSync(new URL("../src/lib/verifiedSubjectCatalog.json", import.meta.url), "utf8"));
const url = new URL(process.env.DATABASE_URL);
const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
let ca = process.env.AIVEN_CA_CERT || process.env.DATABASE_CA_CERT || process.env.DB_CA_CERT;
ca = ca?.replace(/\\n/g, "\n");
if (ca && !ca.includes("BEGIN CERTIFICATE") && existsSync(ca)) ca = readFileSync(ca, "utf8");
const connection = await mariadb.createConnection({
  host:url.hostname,port:Number(url.port||3306),user:decodeURIComponent(url.username),password:decodeURIComponent(url.password),
  database:decodeURIComponent(url.pathname.slice(1)),connectTimeout:10000,
  ssl:local?undefined:{...(ca?.includes("BEGIN CERTIFICATE")?{ca}:{}),rejectUnauthorized:true},
});
const json = value => typeof value === "string" ? JSON.parse(value) : value;
try {
  const subjects = await connection.query("SELECT slug, active, gradeLevels, curriculum FROM subjects");
  const topics = await connection.query("SELECT s.slug, t.name, t.active, t.gradeLevels, t.curriculum FROM topics t JOIN subjects s ON s.id=t.subjectId");
  const expectedSubjects = new Set(data.map(s=>s.slug));
  const expectedTopics = new Set(data.flatMap(s=>s.topics.map(t=>`${s.slug}::${t.name}`)));
  if(subjects.some(s=>s.active&&!expectedSubjects.has(s.slug))||topics.some(t=>t.active&&!expectedTopics.has(`${t.slug}::${t.name}`)))throw new Error("Unsupported active catalog entries remain.");
  const verify = (row, expected, label) => {
    const evidence = json(row?.curriculum);
    if(!row||JSON.stringify(json(row.gradeLevels))!==JSON.stringify(expected.gradeLevels)||
      Object.entries(expected.curriculum).some(([key,value])=>!isDeepStrictEqual(evidence?.[key],value))){
      throw new Error(`Reviewed curriculum evidence does not match: ${label}`);
    }
  };
  for(const subject of data){
    verify(subjects.find(s=>s.slug===subject.slug),subject,subject.slug);
    for(const topic of subject.topics)verify(topics.find(t=>t.slug===subject.slug&&t.name===topic.name),topic,`${subject.slug}: ${topic.name}`);
  }
  console.log(`Curriculum verification passed: ${data.length} subjects, ${expectedTopics.size} topics; grade/source evidence matches. Administrator disables preserved.`);
} finally {await connection.end();}
