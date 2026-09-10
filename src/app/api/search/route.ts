import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { browseClassesWhere } from "@/lib/classQueries";
import { getSubjects, resolveSubjectSlugs } from "@/lib/subjects";
import { getSetting } from "@/lib/settings";
import { tutorPoolWhere } from "@/lib/topicRequestVisibility";
import { portalPath } from "@/lib/portalPaths";
import { rateLimit, rateLimitEnabled, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

const PER_GROUP = 6;

// The top-bar box lets the user scope the search. "all" is the blanket search;
// the rest each pin it to one field so e.g. a class code isn't buried under
// subject/topic hits.
const SEARCH_SCOPES = ["all", "tutorCode", "subject", "topic", "classCode"] as const;
type SearchScope = (typeof SEARCH_SCOPES)[number];

/**
 * The `OR` clauses for a class query under a given scope, or `null` when this
 * scope should not return classes at all (e.g. "tutorCode").
 */
function classOrFor(
  scope: SearchScope,
  q: string,
  subjectSlugs: string[],
): Prisma.TutorClassWhereInput[] | null {
  const bySubject: Prisma.TutorClassWhereInput[] = [
    { subject: { contains: q } },
    ...(subjectSlugs.length ? [{ subject: { in: subjectSlugs } }] : []),
  ];
  switch (scope) {
    case "tutorCode":
      return null;
    case "classCode":
      return [{ code: { contains: q } }];
    case "subject":
      return bySubject;
    case "topic":
      return [{ topics: { some: { topic: { contains: q } } } }];
    default:
      return [
        { code: { contains: q } },
        ...bySubject,
        { topics: { some: { topic: { contains: q } } } },
      ];
  }
}

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}
export interface SearchGroup {
  kind: "class" | "tutor" | "topic";
  label: string;
  items: SearchItem[];
}

// ─── GET: cross-cutting quick search for the top-bar box ───────────────────
// Role-aware. Learners get browsable classes + verified tutors + topics; tutors
// get their own classes + topics; admins get all classes + accounts + topics.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (rateLimitEnabled()) {
      const limited = rateLimit(`search:user:${session.user.id}`, 40, MINUTE_MS);
      if (!limited.ok) return tooManyRequests(limited.retryAfter);
    }

    const params = new URL(req.url).searchParams;
    const q = (params.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json({ groups: [] });

    const scopeParam = params.get("scope") as SearchScope | null;
    const scope: SearchScope =
      scopeParam && SEARCH_SCOPES.includes(scopeParam) ? scopeParam : "all";

    const subjectSlugs = await resolveSubjectSlugs(q);
    const classOr = classOrFor(scope, q, subjectSlugs);
    const wantTopics = scope === "all" || scope === "topic";
    const wantTutorCode = scope === "all" || scope === "tutorCode";

    const role = session.user.role;
    const groups: SearchGroup[] = [];

    // ── Topics (all roles) ──
    const topicMatches: SearchItem[] = [];
    const catalog = wantTopics ? await getSubjects() : [];
    const ql = q.toLowerCase();
    for (const s of catalog) {
      for (const t of s.topics) {
        if (t.name.toLowerCase().includes(ql)) {
          topicMatches.push({
            id: `${s.slug}:${t.name}`,
            title: t.name,
            subtitle: s.name,
            href: portalPath(role, `/classes?q=${encodeURIComponent(t.name)}`),
          });
        }
        if (topicMatches.length >= PER_GROUP) break;
      }
      if (topicMatches.length >= PER_GROUP) break;
    }

    if (role === "STUDENT_LEARNER") {
      // When the platform reveals tutor names, learners can also search by name
      // and see the real name in results instead of just the anonymous ID.
      const showRealNames = await getSetting("showTutorRealNames");
      // "tutorCode" scope matches the anonymous ID only; "all" also matches the
      // real name where the platform reveals it.
      const tutorOr: Prisma.UserWhereInput[] =
        scope === "tutorCode"
          ? [{ anonymousId: { contains: q } }]
          : [
              { anonymousId: { contains: q } },
              ...(showRealNames
                ? [{ firstName: { contains: q } }, { lastName: { contains: q } }]
                : []),
            ];
      const [classes, tutors] = await Promise.all([
        classOr
          ? prisma.tutorClass.findMany({
              where: { ...browseClassesWhere(session.user.id), OR: classOr },
              select: {
                id: true,
                code: true,
                subject: true,
                topics: { select: { topic: true }, take: 3 },
              },
              take: PER_GROUP,
              orderBy: { createdAt: "desc" },
            })
          : Promise.resolve([]),
        wantTutorCode
          ? prisma.user.findMany({
              where: {
                role: "STUDENT_TUTOR",
                status: "ACTIVE",
                tutorProfile: { topicCertifications: { some: { status: "CERTIFIED" } } },
                OR: tutorOr,
              },
              select: { id: true, anonymousId: true, firstName: true, lastName: true },
              take: PER_GROUP,
              orderBy: { anonymousId: "asc" },
            })
          : Promise.resolve([]),
      ]);

      if (classes.length)
        groups.push({
          kind: "class",
          label: "Classes",
          items: classes.map((c) => ({
            id: c.id,
            title: `${c.code} · ${c.subject}`,
            subtitle: c.topics.map((t) => t.topic).join(", "),
            href: `/learner/classes/${c.id}`,
          })),
        });
      if (tutors.length)
        groups.push({
          kind: "tutor",
          label: "Tutors",
          items: tutors.map((t) => {
            const name = `${t.firstName} ${t.lastName}`.trim();
            return {
              id: t.id,
              title: showRealNames && name ? name : t.anonymousId,
              subtitle: showRealNames && name ? t.anonymousId : undefined,
              href: `/learner/tutors/${t.id}`,
            };
          }),
        });
    } else if (role === "STUDENT_TUTOR") {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          topicCertifications: {
            where: { status: "CERTIFIED" },
            select: { subject: true, topic: true },
          },
        },
      });

      const wantRequests = scope === "all" || scope === "subject" || scope === "topic";
      const [classes, requests] = await Promise.all([
        classOr
          ? prisma.tutorClass.findMany({
              where: { tutorProfile: { userId: session.user.id }, OR: classOr },
              select: { id: true, code: true, subject: true, status: true },
              take: PER_GROUP,
              orderBy: { createdAt: "desc" },
            })
          : Promise.resolve([]),
        tutorProfile && wantRequests
          ? prisma.topicRequest.findMany({
              where: {
                AND: [
                  tutorPoolWhere(tutorProfile.id, tutorProfile.topicCertifications),
                  {
                    OR:
                      scope === "subject"
                        ? [{ subject: { contains: q } }]
                        : scope === "topic"
                        ? [{ topics: { some: { topic: { contains: q } } } }]
                        : [
                            { subject: { contains: q } },
                            { topics: { some: { topic: { contains: q } } } },
                          ],
                  },
                ],
              },
              select: {
                id: true,
                subject: true,
                topics: { select: { topic: true }, take: 3 },
                directedTutorProfileId: true,
              },
              take: PER_GROUP,
              orderBy: { createdAt: "asc" },
            })
          : Promise.resolve([]),
      ]);

      if (classes.length)
        groups.push({
          kind: "class",
          label: "Your classes",
          items: classes.map((c) => ({
            id: c.id,
            title: `${c.code} · ${c.subject}`,
            subtitle: c.status,
            href: `/tutor/classes/${c.id}`,
          })),
        });

      if (requests.length)
        groups.push({
          kind: "topic",
          label: "Class requests",
          items: requests.map((r) => ({
            id: r.id,
            title: `${r.subject} · ${r.topics.map((t) => t.topic).join(", ")}`,
            subtitle:
              r.directedTutorProfileId === tutorProfile?.id ? "Directed to you" : "Public request",
            href: `/tutor/requests/${r.id}/accept`,
          })),
        });
    } else {
      // ADMIN
      const [classes, users] = await Promise.all([
        classOr
          ? prisma.tutorClass.findMany({
              where: { OR: classOr },
              select: { id: true, code: true, subject: true, status: true },
              take: PER_GROUP,
              orderBy: { createdAt: "desc" },
            })
          : Promise.resolve([]),
        wantTutorCode
          ? prisma.user.findMany({
              where: {
                role: { not: "ADMIN" },
                OR:
                  scope === "tutorCode"
                    ? [{ anonymousId: { contains: q } }]
                    : [
                        { anonymousId: { contains: q } },
                        { firstName: { contains: q } },
                        { lastName: { contains: q } },
                        { email: { contains: q } },
                      ],
              },
              select: { id: true, anonymousId: true, role: true, firstName: true, lastName: true },
              take: PER_GROUP,
              orderBy: { anonymousId: "asc" },
            })
          : Promise.resolve([]),
      ]);
      if (classes.length)
        groups.push({
          kind: "class",
          label: "Classes",
          items: classes.map((c) => ({
            id: c.id,
            title: `${c.code} · ${c.subject}`,
            subtitle: c.status,
            href: `/admin/classes?q=${encodeURIComponent(c.code)}`,
          })),
        });
      if (users.length)
        groups.push({
          kind: "tutor",
          label: "Accounts",
          items: users.map((u) => ({
            id: u.id,
            title: u.anonymousId,
            subtitle: `${u.firstName} ${u.lastName}`.trim(),
            href: `/admin/users/${u.id}`,
          })),
        });
    }

    if (topicMatches.length) groups.push({ kind: "topic", label: "Topics", items: topicMatches });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error running search:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
