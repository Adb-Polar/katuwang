import Link from "next/link";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import HeroIllustration from "./HeroIllustration";
import "./landing.css";

// The landing page has its own type and palette (see landing.css); the portals keep the app theme.
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--lp-serif",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--lp-sans", display: "swap" });

const STEPS = [
  { title: "Pick a topic", body: "Choose a subject and topic from Grades 7–12, or request one." },
  { title: "Get matched", body: "Open classes are ranked by topic, grade and schedule." },
  { title: "Learn on campus", body: "Every tutor has passed an assessment for that topic." },
  { title: "See your progress", body: "A short test before and after shows what you learned." },
];

const FAQS = [
  { q: "Is it free?", a: "Yes. Katuwang is non-profit and has no fees." },
  { q: "Who can join?", a: "Enrolled Grade 7–12 students at Taysan Resettlement Integrated School, Legazpi City." },
  { q: "What if no class covers my topic?", a: "Send a topic request from your portal. Qualified tutors in that subject are notified." },
];

export default function LandingPage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className={`kt-landing ${plexSerif.variable} ${plexSans.variable}`}>
      <header className="lp-header">
        <div className="lp-wrap">
          <Link href="/" className="lp-brand">
            <LandingLogo />
            Katuwang
          </Link>
          <nav className="lp-nav" aria-label="Primary">
            <a href="#how">How it works</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <div className="lp-actions">
            {signedIn ? (
              <Link href="/dashboard" className="lp-btn lp-btn-primary">
                Your portal
              </Link>
            ) : (
              <>
                <Link href="/login" className="lp-btn">
                  Log in
                </Link>
                <Link href="/register" className="lp-btn lp-btn-primary lp-signup">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="lp-wrap lp-hero">
          <div className="lp-hero-copy">
            <p className="lp-muted">Free peer tutoring at Taysan Resettlement Integrated School</p>
            <h1>
              A little help.
              <br />
              <span className="lp-accent">A clearer next step.</span>
            </h1>
            <p className="lp-lead">
              Learn a topic from a classmate who has passed a test on it, without giving up your name.
            </p>
            <div className="lp-ctas">
              {signedIn ? (
                <Link href="/dashboard" className="lp-btn lp-btn-primary">
                  Go to your portal
                </Link>
              ) : (
                <>
                  <Link href="/register/learner" className="lp-btn lp-btn-primary">
                    Find a tutor
                  </Link>
                  <Link href="/register/tutor" className="lp-btn">
                    Become a tutor
                  </Link>
                </>
              )}
            </div>
            <p className="lp-tagline" lang="fil">
              Katuwang mo sa pag-aaral. <span lang="en">(Your partner in learning.)</span>
            </p>
          </div>
          <HeroIllustration />
        </section>

        <section className="lp-section lp-band" id="how">
          <div className="lp-wrap">
            <div className="lp-block-head">
              <p className="lp-kicker" lang="fil">Paano?</p>
              <h2>How it works</h2>
            </div>
            <ol className="lp-steps">
              {STEPS.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section" id="privacy">
          <div className="lp-wrap lp-privacy">
            <div className="lp-privacy-copy">
              <p className="lp-kicker" lang="fil">Pribado</p>
              <h2>Learner names stay private.</h2>
              <Link href="/privacy-policy" className="lp-link">
                Read the privacy policy
              </Link>
            </div>
            <ul className="lp-sees">
              <li>
                <span className="lp-as">If you’re a learner</span>
                <p>
                  your tutor shows up as <span className="lp-id lp-id-tutor">TUT-0148</span>{" "}
                  <span className="lp-aside">or by name, if your school allows it</span>
                </p>
              </li>
              <li>
                <span className="lp-as">If you’re a tutor</span>
                <p>
                  your learner shows up as <span className="lp-id lp-id-learner">STU-2071</span>
                </p>
              </li>
              <li>
                <span className="lp-as">School admins</span>
                <p>see real names, only to approve accounts.</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-wrap lp-join">
            <div className="lp-join-learner">
              <h2>Need help?</h2>
              <p className="lp-muted">Open to every student in Grades 7–12.</p>
              <Link href="/register/learner" className="lp-link">
                Register as a learner →
              </Link>
            </div>
            <div className="lp-join-tutor">
              <h2>Good at a subject?</h2>
              <p className="lp-muted">Grades 9–12 can apply, pass a topic test, and earn service hours.</p>
              <Link href="/register/tutor" className="lp-link">
                Apply as a tutor →
              </Link>
            </div>
          </div>
        </section>

        <section className="lp-section" id="faq">
          <div className="lp-wrap">
            <div className="lp-block-head">
              <p className="lp-kicker" lang="fil">Mga tanong</p>
              <h2>Questions</h2>
            </div>
            <div className="lp-faq">
              {FAQS.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <span>Katuwang · Taysan Resettlement Integrated School, Legazpi City, Albay</span>
          <Link href="/privacy-policy">Privacy policy</Link>
        </div>
      </footer>
    </div>
  );
}

/** The Katuwang mark, drawn inline so it takes the landing page's main colour. */
function LandingLogo() {
  return (
    <svg className="lp-logo" viewBox="0 0 560 525" aria-hidden="true">
      <path d="M486.65 56.5554H277.884C277.884 158.117 193.249 242.752 73.3501 262.5C150.932 262.5 221.461 262.5 299.043 262.5C348.799 262.5 396.518 240.802 431.701 202.18C466.884 163.558 486.65 111.175 486.65 56.5554Z" />
      <path d="M486.65 468.445H277.884C277.884 366.883 193.249 282.248 73.3501 262.5C150.932 262.5 221.461 262.5 299.043 262.5C348.799 262.5 396.518 284.198 431.701 322.82C466.884 361.442 486.65 413.825 486.65 468.445Z" />
    </svg>
  );
}
