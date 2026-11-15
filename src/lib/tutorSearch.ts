import type { Prisma } from "@prisma/client";

/** Name matching follows the same visibility flag as the returned tutor name. */
export function tutorSearchClauses(query: string, showRealNames: boolean): Prisma.UserWhereInput[] {
  const q = query.trim();
  if (!q) return [];
  return [
    { anonymousId: { contains: q } },
    ...(showRealNames ? [{
      AND: q.split(/\s+/).map(word => ({
        OR: [{ firstName: { contains: word } }, { lastName: { contains: word } }],
      })),
    }] : []),
  ];
}
