import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Reset Password | Katuwang Portal",
  description: "Request a password reset link for your Katuwang account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
