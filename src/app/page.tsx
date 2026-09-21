import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import StoryTimeline from "@/components/landing/StoryTimeline";
import PrivacyPayoff from "@/components/landing/PrivacyPayoff";
import StoryEnd from "@/components/landing/StoryEnd";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Katuwang — free peer tutoring for Grades 7–12",
  description:
    "A free peer tutoring platform for Junior and Senior High School students: match with a verified peer tutor, learn on campus, and track progress, with student identities kept private.",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const signedIn = Boolean(session);

  return (
    <main className="min-h-screen bg-base-200">
      <LandingNav signedIn={signedIn} />
      <LandingHero signedIn={signedIn} />
      <StoryTimeline />
      <PrivacyPayoff />
      <StoryEnd signedIn={signedIn} />
      <LandingFooter />
    </main>
  );
}
