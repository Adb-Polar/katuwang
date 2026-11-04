import { redirect } from "next/navigation";

export default async function LearnerRequestsPage() {
  redirect("/learner/tutors?tab=requests");
}
