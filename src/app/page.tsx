import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UploadedLanding from "@/components/landing/UploadedLanding";

export const metadata: Metadata = {
  title: "Katuwang — free peer tutoring for Grades 7–12",
  description:
    "A free peer tutoring platform for Junior and Senior High School students: match with a verified peer tutor, learn on campus, and track progress, with student identities kept private.",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const signedIn = Boolean(session);

  return <UploadedLanding signedIn={signedIn} />;
}
