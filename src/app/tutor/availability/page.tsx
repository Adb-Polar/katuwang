import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AvailabilityEditor, { AvailabilitySlot } from "@/components/tutor/AvailabilityEditor";

export const metadata = {
  title: "Availability | Katuwang",
};

export default async function TutorAvailabilityPage() {
  const session = await getServerSession(authOptions);

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: session!.user.id },
    select: {
      availability: {
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Your availability"
        subtitle="Let yourself keep track of your weekly open time slots. This is informational only for now — it isn't yet shown to learners."
      />
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <AvailabilityEditor
            initialSlots={(tutorProfile?.availability ?? []) as AvailabilitySlot[]}
          />
        </div>
      </div>
    </div>
  );
}
