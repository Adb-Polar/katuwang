import VerifyEmailForm from "@/components/auth/VerifyEmailForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Verify Email | Katuwang",
  description: "Confirm your Katuwang account email address.",
};

export default async function VerifyEmailPage({
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
