import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import ContactForm from "@/components/contact/ContactForm";

export const metadata = {
  title: "Contact an Administrator | Katuwang",
  description: "Send a message to the Katuwang administrators — no sign-in needed.",
};

export default async function ContactPage() {
  const session = await getServerSession(authOptions);
  const signedIn = Boolean(session);

  return (
    <AuthLayout>
      <ContactForm
        initialName={session?.user.fullName ?? ""}
        initialEmail={session?.user.email ?? ""}
        backHref={signedIn ? "/dashboard" : "/login"}
        backLabel={signedIn ? "Back to your portal" : "Back to sign in"}
      />
    </AuthLayout>
  );
}
