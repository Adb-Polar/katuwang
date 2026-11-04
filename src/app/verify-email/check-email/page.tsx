import AuthLayout from "@/components/auth/AuthLayout";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export const metadata = {
  title: "Check Your Email | Katuwang",
  description: "Enter your Katuwang email verification code.",
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;
  return (
    <AuthLayout>
      <VerifyEmailForm initialEmail={email} />
    </AuthLayout>
  );
}
