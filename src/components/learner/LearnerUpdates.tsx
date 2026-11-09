"use client";

import { useRouter, useSearchParams } from "next/navigation";
import NotificationList from "@/components/notifications/NotificationList";
import MyReportsList from "./MyReportsList";

export default function LearnerUpdates() {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") === "reports" ? "reports" : "notifications";
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Notifications" className="tabs tabs-box w-fit">
        <button role="tab" type="button" aria-selected={view === "notifications"} className={`tab ${view === "notifications" ? "tab-active" : ""}`} onClick={() => router.push("/learner/notifications")}>Notifications</button>
        <button role="tab" type="button" aria-selected={view === "reports"} className={`tab ${view === "reports" ? "tab-active" : ""}`} onClick={() => router.push("/learner/notifications?view=reports")}>Report logs</button>
      </div>
      {view === "reports" ? <MyReportsList /> : <NotificationList />}
    </div>
  );
}
