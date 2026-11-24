import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";

export const metadata = {
  title: "My Profile | Katuwang",
};

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true, anonymousId: true },
  });
  if (!admin) redirect("/login");

  const identityRows = [
    { label: "Name", value: `${admin.firstName} ${admin.lastName}` },
    { label: "Email", value: admin.email },
    { label: "Admin ID", value: admin.anonymousId },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin Portal" title="Your account" subtitle="Your administrator identity and password." />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="card kt-card lg:col-span-2">
          <div className="card-body gap-4">
            <h2 className="card-title text-sm font-bold">Identity</h2>
            <dl className="space-y-3">
              {identityRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-base-content/60">{row.label}</dt>
                  <dd className="font-semibold break-all text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="card kt-card lg:col-span-3">
          <div className="card-body gap-4">
            <h2 className="card-title text-sm font-bold">Change password</h2>
            <ChangePasswordForm endpoint="/api/admin/profile/password" />
          </div>
        </section>
      </div>
    </div>
  );
}
