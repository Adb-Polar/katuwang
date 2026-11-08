import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Reset Password | Katuwang Portal",
  description: "Verify your email with a code and reset your Katuwang password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
