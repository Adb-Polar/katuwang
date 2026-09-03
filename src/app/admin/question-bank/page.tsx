import { redirect } from "next/navigation";

// Question bank moved under the grouped "Assessment" section.
export default function AdminQuestionBankRedirect() {
  redirect("/admin/assessment/question-bank");
}
