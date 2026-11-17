import RegisterForm from "@/components/auth/RegisterForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Register as Learner | Katuwang",
  description: "Sign up as a Student Learner to get tutoring support.",
};

export default function LearnerRegisterPage() {
  return (
    <AuthLayout width="wide">
      <RegisterForm type="LEARNER" />
    </AuthLayout>
  );
}
