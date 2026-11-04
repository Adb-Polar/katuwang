import { redirect } from "next/navigation";

export const metadata = {
  title: "My Reports | Katuwang",
};

export default function LearnerReportsPage() {
  redirect("/learner/notifications?view=reports");
}
