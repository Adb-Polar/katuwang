import RegisterForm from "@/components/auth/RegisterForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Register as Tutor | Katuwang",
  description: "Sign up as a Student Tutor to share knowledge and guide others.",
};

export default function TutorRegisterPage() {
  return (
    <AuthLayout width="wide">
      <RegisterForm type="TUTOR" />
    </AuthLayout>
  );
}
