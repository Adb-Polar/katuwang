import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { browseClassesWhere } from "@/lib/classQueries";
import { getSubjects } from "@/lib/subjects";
import { getSetting } from "@/lib/settings";

const PER_GROUP = 6;

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

    const q = (new URL(req.url).searchParams.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json({ groups: [] });

    const role = session.user.role;
    const groups: SearchGroup[] = [];

    // ── Topics (all roles) ──
    const topicMatches: SearchItem[] = [];
    const catalog = await getSubjects();
    const ql = q.toLowerCase();
    for (const s of catalog) {
      for (const t of s.topics) {
        if (t.name.toLowerCase().includes(ql)) {
          topicMatches.push({
            id: `${s.slug}:${t.name}`,
            title: t.name,
            subtitle: s.name,
            href:
              role === "STUDENT_LEARNER"
                ? `/learner/classes?q=${encodeURIComponent(t.name)}`
                : role === "STUDENT_TUTOR"
                ? `/tutor/classes?q=${encodeURIComponent(t.name)}`
                : `/admin/classes?q=${encodeURIComponent(t.name)}`,
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
      const [classes, tutors] = await Promise.all([
        prisma.tutorClass.findMany({
          where: {
            ...browseClassesWhere(session.user.id),
            OR: [
              { code: { contains: q } },
              { subject: { contains: q } },
              { topics: { some: { topic: { contains: q } } } },
            ],
          },
          select: { id: true, code: true, subject: true, topics: { select: { topic: true }, take: 3 } },
          take: PER_GROUP,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
          where: {
            role: "STUDENT_TUTOR",
            status: "ACTIVE",
            tutorProfile: { topicCertifications: { some: { status: "CERTIFIED" } } },
            OR: [
              { anonymousId: { contains: q } },
              ...(showRealNames
                ? [{ firstName: { contains: q } }, { lastName: { contains: q } }]
                : []),
            ],
          },
          select: { id: true, anonymousId: true, firstName: true, lastName: true },
          take: PER_GROUP,
          orderBy: { anonymousId: "asc" },
        }),
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
      const classes = await prisma.tutorClass.findMany({
        where: {
          tutorProfile: { userId: session.user.id },
          OR: [{ code: { contains: q } }, { subject: { contains: q } }, { topics: { some: { topic: { contains: q } } } }],
        },
        select: { id: true, code: true, subject: true, status: true },
        take: PER_GROUP,
        orderBy: { createdAt: "desc" },
      });
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
    } else {
      // ADMIN
      const [classes, users] = await Promise.all([
        prisma.tutorClass.findMany({
          where: {
            OR: [
              { code: { contains: q } },
              { subject: { contains: q } },
              { topics: { some: { topic: { contains: q } } } },
            ],
          },
          select: { id: true, code: true, subject: true, status: true },
          take: PER_GROUP,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
          where: {
            role: { not: "ADMIN" },
            OR: [
              { anonymousId: { contains: q } },
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
            ],
          },
          select: { id: true, anonymousId: true, role: true, firstName: true, lastName: true },
          take: PER_GROUP,
          orderBy: { anonymousId: "asc" },
        }),
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
