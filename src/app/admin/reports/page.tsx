import { redirect } from "next/navigation";

// Analytics now lives on the admin dashboard; keep old links and bookmarks working.
export default function AdminReportsPage() {
  redirect("/admin");
}
