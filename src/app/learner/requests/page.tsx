import { redirect } from "next/navigation";

export const metadata = {
  title: "My Requests | Katuwang",
};

export default function LearnerRequestsPage() {
  redirect("/learner/tutors#requests");
}
