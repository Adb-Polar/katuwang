import AuthLayout from "@/components/auth/AuthLayout";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export const metadata = {
  title: "Verify Your Email | Katuwang",
  description: "Your Katuwang account still needs email verification.",
};

export default async function AccountUnverifiedPage({
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
