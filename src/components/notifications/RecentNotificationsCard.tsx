import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/datetime";

const RECENT_COUNT = 4;

/** Overview-page card with the user's latest notifications and a link to the full list. */
export default async function RecentNotificationsCard({
  userId,
  notificationsHref,
}: {
  userId: string;
  notificationsHref: string;
}) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: RECENT_COUNT,
    select: { id: true, message: true, link: true, readAt: true, createdAt: true },
  });

  return (
    <section className="card kt-card">
      <div className="card-body gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="card-title text-sm font-bold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Recent notifications
          </h2>
          <Link href={notificationsHref} className="link link-primary text-2xs font-bold flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="text-xs text-base-content/60 border border-dashed border-base-300 rounded-lg py-5 px-3 text-center">
            Nothing yet. Updates about your classes and requests will show up here.
          </p>
        ) : (
          <ul className="divide-y divide-base-200">
            {notifications.map((notification) => (
              <li key={notification.id} className="py-2 first:pt-0 last:pb-0">
                <Link href={notification.link ?? notificationsHref} className="group flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${notification.readAt ? "bg-base-300" : "bg-primary"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs text-base-content/85 group-hover:text-primary line-clamp-2">
                      {notification.readAt ? "" : <span className="sr-only">Unread: </span>}
                      {notification.message}
                    </span>
                    <span className="block text-2xs text-base-content/55 mt-0.5">
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
