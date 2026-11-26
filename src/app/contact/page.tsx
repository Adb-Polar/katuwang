import { MessageSquare } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeading from "@/components/auth/AuthHeading";
import ContactForm from "@/components/contact/ContactForm";
import { CONTACT_CATEGORIES, type ContactCategoryValue } from "@/lib/validations/contact";

export const metadata = {
  title: "Contact an administrator | Katuwang",
  description: "Send a message to the Katuwang administrators. You do not need to be signed in.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ about?: string }> }) {
  const { about } = await searchParams;
  const initialCategory = CONTACT_CATEGORIES.find((c) => c.value === about)?.value as ContactCategoryValue | undefined;

  return (
    <AuthLayout>
      <span className="lp-status-icon bg-primary/10 text-primary">
        <MessageSquare className="h-5 w-5" aria-hidden="true" />
      </span>
      <AuthHeading kicker="Makipag-ugnayan" title="Contact an administrator">
        Can&apos;t sign in, or was your account suspended, banned or declined? Write to the administrators here. You
        don&apos;t need to be signed in.
      </AuthHeading>
      <ContactForm initialCategory={initialCategory} />
    </AuthLayout>
  );
}
