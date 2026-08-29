import AuthLayout from "@/components/auth/AuthLayout";
import LogoutConfirm from "@/components/auth/LogoutConfirm";

export const metadata = {
  title: "Sign Out | Katuwang",
  description: "Sign out of your Katuwang portal.",
};

export default function LogoutPage() {
  return (
    <AuthLayout>
      <LogoutConfirm />
    </AuthLayout>
  );
}
