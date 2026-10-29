"use client";

import { useState } from "react";
import "./uploaded-landing.css";

const privacyData = {
      learner: {
        badge: 'WHAT THE LEARNER SEES',
        badgeClass: 'text-learner-violet bg-learner-violet-light',
        title: 'Class Schedule & Tutor Identifier',
        idLabel: 'TUTOR IDENTIFIER',
        idValue: 'TUT-0148',
        hiddenLabel: 'REAL NAME / CONTACT',
        hiddenValue: 'Hidden on web platform',
        desc: 'Learners interact with tutors using unique anonymous IDs like TUT-0148. Contact numbers and personal emails are never displayed publicly.'
      },
      tutor: {
        badge: 'WHAT THE TUTOR SEES',
        badgeClass: 'text-dark-gold-text bg-tutor-gold-light',
        title: 'Enrolled Learner Roster & Progress',
        idLabel: 'LEARNER IDENTIFIER',
        idValue: 'STU-2071',
        hiddenLabel: 'LEARNER SURNAME / PHONE',
        hiddenValue: 'Hidden on tutor dashboard',
        desc: 'Tutors review class rosters and target topic requests using learner IDs (e.g., STU-2071) to prepare custom lesson notes while maintaining privacy.'
      },
      admin: {
        badge: 'WHAT AUTHORIZED ADMINS SEE',
        badgeClass: 'text-brand-teal bg-brand-teal-light',
        title: 'Identity Verification & Safety Moderation',
        idLabel: 'SYSTEM MATCH RECORD',
        idValue: 'STU-2071 ↔ TUT-0148',
        hiddenLabel: 'VERIFIED TRIS RECORD',
        hiddenValue: 'Full Name, LRN & Grade Access',
        desc: 'Authorized TRIS administrators access real identities specifically for account registration approval, grade level validation, and safety moderation.'
      }
    } as const;

export default function UploadedLanding({ signedIn }: { signedIn: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [role, setRole] = useState<keyof typeof privacyData>("learner");
  const privacy = privacyData[role];
  return <div className="uploaded-landing min-h-screen flex flex-col antialiased selection:bg-brand-teal selection:text-white">

  <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md paper-border border-t-0 border-x-0">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

      <a href="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brand-teal rounded-md p-1">
        <div className="w-8 h-8 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal transition-transform group-hover:scale-105">

          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="3"/>
            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
            <circle cx="17" cy="9" r="2.5"/>
            <path d="M14 21v-1.5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3V21"/>
          </svg>
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-text-main group-hover:text-brand-teal transition-colors">Katuwang</span>
          <span className="font-mono-ui text-[10px] text-brand-teal bg-brand-teal-light px-1.5 py-0.5 rounded border border-brand-teal/20 ml-1.5">sa TRIS</span>
        </div>
      </a>

      <nav className="hidden md:flex items-center gap-6 font-mono-ui text-xs tracking-tight">
        <a href="#how-it-works" className="text-text-main/70 hover:text-brand-teal transition-colors">How It Works</a>
        <a href="#roles" className="text-text-main/70 hover:text-brand-teal transition-colors">Learners & Tutors</a>
        <a href="#privacy" className="text-text-main/70 hover:text-brand-teal transition-colors">Privacy & RA 10173</a>
        <a href="#faq" className="text-text-main/70 hover:text-brand-teal transition-colors">FAQ</a>
      </nav>

      <div className="hidden md:flex items-center gap-3">
        <a href={signedIn ? "/dashboard" : "/login"} className="font-mono-ui text-xs px-3.5 py-2 rounded-md border border-border-subtle text-text-main hover:bg-card-surface transition-all">
          {signedIn ? "Your portal" : "Log in"}
        </a>
        {!signedIn && <a href="/register" className="font-mono-ui text-xs px-3.5 py-2 rounded-md bg-brand-teal text-white font-medium hover:bg-brand-teal/90 shadow-sm transition-all">
          Create account
        </a>}
      </div>

      <button id="mobileMenuBtn" onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-md border border-border-subtle text-text-main focus:outline-none" aria-label="Toggle Navigation" aria-expanded={menuOpen} aria-controls="mobileMenu">
        <svg id="menuIcon" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

    </div>

    <div id="mobileMenu" className={`${menuOpen ? "" : "hidden"} md:hidden paper-border border-x-0 border-b bg-card-surface px-4 py-4 space-y-3 font-mono-ui text-xs`}>
      <a href="#how-it-works" onClick={() => setMenuOpen(!menuOpen)} className="block py-1.5 text-text-main hover:text-brand-teal">How It Works</a>
      <a href="#roles" onClick={() => setMenuOpen(!menuOpen)} className="block py-1.5 text-text-main hover:text-brand-teal">Learners & Tutors</a>
      <a href="#privacy" onClick={() => setMenuOpen(!menuOpen)} className="block py-1.5 text-text-main hover:text-brand-teal">Privacy & RA 10173</a>
      <a href="#faq" onClick={() => setMenuOpen(!menuOpen)} className="block py-1.5 text-text-main hover:text-brand-teal">FAQ</a>
      <div className="pt-2 border-t border-border-subtle flex gap-2">
        <a href={signedIn ? "/dashboard" : "/login"} className="w-1/2 py-2 text-center border border-border-subtle rounded-md">{signedIn ? "Your portal" : "Log in"}</a>
        {!signedIn && <a href="/register" className="w-1/2 py-2 text-center bg-brand-teal text-white rounded-md">Create account</a>}
      </div>
    </div>
  </header>

  <main>
  <section className="py-12 md:py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

      <div className="lg:col-span-7 space-y-6">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal-light border border-brand-teal/20 text-brand-teal text-xs font-mono-ui">
          <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse"></span>
          <span>Taysan Resettlement Integrated School • Grades 7–12</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl text-text-main headline-900 leading-[1.08]">
          A little help. <br/>
          <span className="text-brand-teal">A clearer next step.</span>
        </h1>

        <p className="text-lg sm:text-xl text-text-main/80 font-normal max-w-2xl leading-relaxed">
          Find a verified peer tutor, make time to learn, and see your progress. Free non-profit peer tutoring management built specifically for students at TRIS.
        </p>

        <div className="flex items-center gap-2 font-mono-ui text-xs text-text-main/60 italic">
          <span>“Katuwang mo sa pag-aaral.”</span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <a href="/register/learner" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-brand-teal text-white font-mono-ui text-xs font-semibold hover:bg-brand-teal/90 shadow-sm transition-all text-center">
            <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Find learning support
          </a>
          <a href="/register/tutor" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-tutor-gold-light border border-tutor-gold/40 text-dark-gold-text font-mono-ui text-xs font-semibold hover:bg-tutor-gold/20 transition-all text-center">
            <svg className="w-4 h-4 text-dark-gold-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Become a tutor
          </a>
        </div>

        <div className="pt-2 flex items-center gap-4 text-xs font-mono-ui text-text-main/50">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            100% Free & Non-Profit
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            On-Campus Tutoring
          </span>
        </div>

      </div>

      <div className="lg:col-span-5">
        <div className="bg-card-surface paper-border paper-shadow rounded-xl p-5 sm:p-6 relative space-y-5">

          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-teal"></span>
              <span className="font-mono-ui text-xs font-bold text-text-main">ACTIVE MATCH MATCHMAKING</span>
            </div>
            <span className="font-mono-ui text-[11px] text-text-main/60 bg-border-subtle/50 px-2 py-0.5 rounded">TRIS Campus</span>
          </div>

          <div className="space-y-3">

            <div className="bg-learner-violet-light/50 border border-learner-violet/20 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-ui text-xs font-bold text-learner-violet">STU-2071</span>
                  <span className="text-[10px] bg-learner-violet text-white font-mono-ui px-1.5 py-0.2 rounded">LEARNER</span>
                </div>
                <p className="text-xs text-text-main/80 mt-1">Seeking help in: <strong className="font-semibold text-text-main">Math 9 (Linear Equations)</strong></p>
              </div>
              <div className="text-right font-mono-ui text-[11px] text-text-main/60">
                <span>Grade 9</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 my-1">
              <div className="h-px bg-border-subtle flex-1"></div>
              <div className="bg-brand-teal text-white font-mono-ui text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span>Auto Match Score: 98%</span>
              </div>
              <div className="h-px bg-border-subtle flex-1"></div>
            </div>

            <div className="bg-tutor-gold-light/60 border border-tutor-gold/30 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-ui text-xs font-bold text-dark-gold-text">TUT-0148</span>
                  <span className="text-[10px] bg-tutor-gold text-dark-gold-text font-mono-ui px-1.5 py-0.2 rounded font-bold">VERIFIED TUTOR</span>
                </div>
                <p className="text-xs text-text-main/80 mt-1">Qualified topic: <strong className="font-semibold text-text-main">Linear Equations & Inequalities</strong></p>
              </div>
              <div className="text-right font-mono-ui text-[11px] text-dark-gold-text">
                <span className="bg-tutor-gold/20 px-1.5 py-0.5 rounded border border-tutor-gold/40">Verified Assessment</span>
              </div>
            </div>

          </div>

          <div className="bg-bg-main paper-border rounded-lg p-3 flex items-center justify-between font-mono-ui text-xs">
            <div className="flex items-center gap-2 text-text-main/80">
              <svg className="w-4 h-4 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span>Room 204 • Thursday 3:30 PM</span>
            </div>
            <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wider">Scheduled</span>
          </div>

          <p className="text-[11px] font-mono-ui text-text-main/50 text-center italic border-t border-border-subtle pt-2.5">
            Illustrative example • Peer-facing identities use anonymous IDs inside the platform
          </p>

        </div>
      </div>

    </div>
  </section>

  <section id="how-it-works" className="py-16 bg-card-surface paper-border border-x-0">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">

      <div className="max-w-2xl space-y-2">
        <span className="font-mono-ui text-xs text-brand-teal font-semibold tracking-wider uppercase">Editorial Sequence</span>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-main tracking-tight">How peer learning happens at TRIS</h2>
        <p className="text-text-main/70 text-sm sm:text-base">A structured, four-step journey connecting learners with verified peer tutors right on school grounds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">

        <div className="bg-bg-main paper-border rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-xs font-bold text-brand-teal bg-brand-teal-light px-2 py-0.5 rounded border border-brand-teal/20">STEP 01</span>
              <span className="font-mono-ui text-[11px] text-text-main/50">Subject & Topic</span>
            </div>
            <h3 className="font-bold text-base text-text-main">Choose what you need help with</h3>
            <p className="text-xs text-text-main/70 leading-relaxed">
              Select your subject and target topic from Grade 7–12 modules, or submit a request if no class exists yet.
            </p>
          </div>
          <div className="bg-card-surface p-2.5 rounded border border-border-subtle font-mono-ui text-[11px] space-y-1 text-text-main/80">
            <div className="flex justify-between font-semibold text-text-main">
              <span>Mathematics 9</span>
              <span className="text-brand-teal">Selected</span>
            </div>
            <p className="text-[10px] text-text-main/60">Topic: Quadratic Functions & Graphs</p>
          </div>
        </div>

        <div className="bg-bg-main paper-border rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-xs font-bold text-brand-teal bg-brand-teal-light px-2 py-0.5 rounded border border-brand-teal/20">STEP 02</span>
              <span className="font-mono-ui text-[11px] text-text-main/50">Auto Match</span>
            </div>
            <h3 className="font-bold text-base text-text-main">Explore ranked class matches</h3>
            <p className="text-xs text-text-main/70 leading-relaxed">
              Our scoring algorithm ranks available classes using topic alignment, grade compatibility, and open schedule slots.
            </p>
          </div>

          <div className="bg-card-surface p-2.5 rounded border border-border-subtle font-mono-ui text-[10px] space-y-1.5">
            <div className="flex justify-between items-center text-text-main font-semibold">
              <span>Match Breakdown</span>
              <span className="text-brand-teal font-bold">95 pts</span>
            </div>
            <div className="w-full bg-border-subtle h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-teal h-full w-[95%]"></div>
            </div>
            <p className="text-[9px] text-text-main/50">Deterministic rule-based scoring (No AI)</p>
          </div>
        </div>

        <div className="bg-bg-main paper-border rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-xs font-bold text-tutor-gold-text bg-tutor-gold-light px-2 py-0.5 rounded border border-tutor-gold/30">STEP 03</span>
              <span className="font-mono-ui text-[11px] text-text-main/50">Verified Session</span>
            </div>
            <h3 className="font-bold text-base text-text-main">Learn with a qualified peer tutor</h3>
            <p className="text-xs text-text-main/70 leading-relaxed">
              Tutors must pass topic-specific assessments before teaching. Tutoring takes place on TRIS school premises.
            </p>
          </div>
          <div className="bg-tutor-gold-light/40 p-2.5 rounded border border-tutor-gold/30 font-mono-ui text-[10px] text-dark-gold-text space-y-1">
            <div className="flex items-center gap-1 font-bold">
              <svg className="w-3 h-3 text-tutor-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
              <span>Topic Qualification Passed</span>
            </div>
            <p className="text-[9px] opacity-80">Verified by TRIS Subject Teacher</p>
          </div>
        </div>

        <div className="bg-bg-main paper-border rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-xs font-bold text-learner-violet bg-learner-violet-light px-2 py-0.5 rounded border border-learner-violet/20">STEP 04</span>
              <span className="font-mono-ui text-[11px] text-text-main/50">Progress</span>
            </div>
            <h3 className="font-bold text-base text-text-main">Track understanding changes</h3>
            <p className="text-xs text-text-main/70 leading-relaxed">
              Complete brief pre-tests and post-tests to visualize your academic growth over sessions.
            </p>
          </div>

          <div className="bg-card-surface p-2.5 rounded border border-border-subtle font-mono-ui text-[10px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-text-main/60">Pre-test: 40%</span>
              <span className="text-learner-violet font-bold">Post-test: 85%</span>
            </div>
            <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden flex">
              <div className="bg-text-main/20 h-full w-[40%]"></div>
              <div className="bg-learner-violet h-full w-[45%]"></div>
            </div>
            <span className="text-[9px] text-learner-violet block font-semibold">+45% Understanding gain</span>
          </div>
        </div>

      </div>

    </div>
  </section>

  <section id="roles" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-10">

    <div className="text-center max-w-2xl mx-auto space-y-2">
      <span className="font-mono-ui text-xs text-brand-teal font-semibold tracking-wider uppercase">Platform Roles</span>
      <h2 className="text-3xl sm:text-4xl font-bold text-text-main tracking-tight">Two distinct paths to participate</h2>
      <p className="text-text-main/70 text-sm sm:text-base">Whether you are looking to master challenging topics or share your knowledge, Katuwang supports your growth.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      <div className="bg-card-surface paper-border rounded-xl p-6 md:p-8 space-y-6 relative border-t-4 border-t-learner-violet shadow-sm">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-learner-violet-light border border-learner-violet/20 font-mono-ui text-xs text-learner-violet font-bold">
            <span>ROLE: LEARNER</span>
          </div>
          <span className="font-mono-ui text-xs text-text-main/50">Grades 7–12</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-text-main">Get the academic support you need</h3>
          <p className="text-sm text-text-main/70 leading-relaxed">
            Find peer tutors who recently mastered the exact topics you're studying in class. Learn at a comfortable pace with relatable classmates.
          </p>
        </div>

        <ul className="space-y-3 font-mono-ui text-xs text-text-main/80">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-learner-violet mt-1.5"></span>
            <span>Browse available classes and get ranked Auto Match suggestions</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-learner-violet mt-1.5"></span>
            <span>Request custom topics when no open class matches your schedule</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-learner-violet mt-1.5"></span>
            <span>Take pre and post-tests to measure your actual understanding</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-border-subtle">
          <a href="/register/learner" className="inline-flex items-center gap-2 font-mono-ui text-xs font-semibold text-learner-violet hover:underline">
            <span>Register as a Learner</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>

      <div className="bg-card-surface paper-border rounded-xl p-6 md:p-8 space-y-6 relative border-t-4 border-t-tutor-gold shadow-sm">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-tutor-gold-light border border-tutor-gold/40 font-mono-ui text-xs text-dark-gold-text font-bold">
            <span>ROLE: TUTOR</span>
          </div>
          <span className="font-mono-ui text-xs text-text-main/50">Grades 9–12</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-text-main">Reinforce your knowledge by teaching</h3>
          <p className="text-sm text-text-main/70 leading-relaxed">
            Pass topic assessments to qualify as an official peer tutor. Gain leadership experience and fulfill school service hours.
          </p>
        </div>

        <ul className="space-y-3 font-mono-ui text-xs text-text-main/80">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-tutor-gold mt-1.5"></span>
            <span>Qualify for topics by completing school-approved assessments</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-tutor-gold mt-1.5"></span>
            <span>Create flexible tutoring schedules during open school hours</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-tutor-gold mt-1.5"></span>
            <span>Organize on-campus study sessions and help fellow TRIS students</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-border-subtle">
          <a href="/register/tutor" className="inline-flex items-center gap-2 font-mono-ui text-xs font-semibold text-dark-gold-text hover:underline">
            <span>Apply as a Tutor</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>

    </div>
  </section>

  <section id="privacy" className="py-16 bg-card-surface paper-border border-x-0">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">

      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-bg-main border border-border-subtle font-mono-ui text-xs text-brand-teal font-semibold">
          <span>REPUBLIC ACT 10173 COMPLIANCE</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-main tracking-tight">Privacy within the platform</h2>
        <p className="text-text-main/70 text-sm sm:text-base leading-relaxed">
          Katuwang protects student privacy in compliance with the Philippine Data Privacy Act of 2012 (RA 10173). Peer-facing interfaces display anonymous identifiers instead of full personal records.
        </p>
      </div>

      <div className="bg-bg-main paper-border rounded-xl p-6 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <span className="font-mono-ui text-xs font-bold text-text-main">SELECT VIEWING PERSPECTIVE:</span>

          <div className="flex flex-wrap gap-2 font-mono-ui text-xs" id="privacyTabs">
            <button onClick={() => setRole("learner")} aria-pressed={role === "learner"} aria-controls="privacyDisplay" id="tab-learner" className={`px-3 py-1.5 rounded border font-medium transition-all ${role === "learner" ? "border-brand-teal bg-brand-teal text-white" : "border-border-subtle bg-card-surface text-text-main hover:bg-border-subtle/40"}`}>
              Learner View
            </button>
            <button onClick={() => setRole("tutor")} aria-pressed={role === "tutor"} aria-controls="privacyDisplay" id="tab-tutor" className={`px-3 py-1.5 rounded border font-medium transition-all ${role === "tutor" ? "border-brand-teal bg-brand-teal text-white" : "border-border-subtle bg-card-surface text-text-main hover:bg-border-subtle/40"}`}>
              Tutor View
            </button>
            <button onClick={() => setRole("admin")} aria-pressed={role === "admin"} aria-controls="privacyDisplay" id="tab-admin" className={`px-3 py-1.5 rounded border font-medium transition-all ${role === "admin" ? "border-brand-teal bg-brand-teal text-white" : "border-border-subtle bg-card-surface text-text-main hover:bg-border-subtle/40"}`}>
              Authorized Admin
            </button>
          </div>
        </div>

        <div id="privacyDisplay" aria-live="polite" className="bg-card-surface p-5 rounded-lg border border-border-subtle space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className={`font-mono-ui text-[11px] ${privacy.badgeClass} px-2 py-0.5 rounded font-bold`}>{privacy.badge}</span>
            <h4 className="text-lg font-bold text-text-main mt-2">{privacy.title}</h4>
          </div>
          <span className="font-mono-ui text-xs text-text-main/50">Platform Portal</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-ui text-xs pt-2">
          <div className="bg-bg-main p-3 rounded border border-border-subtle space-y-1">
            <span className="text-text-main/50 text-[10px]">{privacy.idLabel}</span>
            <p className="font-bold text-brand-teal">{privacy.idValue}</p>
          </div>
          <div className="bg-bg-main p-3 rounded border border-border-subtle space-y-1">
            <span className="text-text-main/50 text-[10px]">{privacy.hiddenLabel}</span>
            <p className="font-bold text-text-main/60 italic">{privacy.hiddenValue}</p>
          </div>
        </div>

        <p className="text-xs text-text-main/70 leading-relaxed border-t border-border-subtle pt-3">
          {privacy.desc}
        </p>
      </div>

        <div className="bg-brand-teal-light/50 border border-brand-teal/20 rounded-lg p-4 text-xs text-text-main/80 space-y-1">
          <p className="font-bold text-brand-teal font-mono-ui">Note on On-Campus Tutoring:</p>
          <p className="leading-relaxed">
            Platform anonymity prevents indexable web exposure of student data. However, because tutoring sessions take place in designated TRIS classrooms, students will naturally recognize each other during in-person sessions.
          </p>
        </div>

      </div>

    </div>
  </section>

  <section id="faq" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-10">

    <div className="text-center space-y-2">
      <span className="font-mono-ui text-xs text-brand-teal font-semibold tracking-wider uppercase">Got Questions?</span>
      <h2 className="text-3xl sm:text-4xl font-bold text-text-main tracking-tight">Frequently Asked Questions</h2>
      <p className="text-text-main/70 text-sm">Clear, factual details about Katuwang's operations at TRIS.</p>
    </div>

    <div className="space-y-3 font-mono-ui text-xs">

      <div className="bg-card-surface paper-border rounded-lg overflow-hidden">
        <button onClick={() => setOpenFaq(openFaq === 1 ? null : 1)} aria-expanded={openFaq === 1} aria-controls="faq-answer-1" className="w-full px-5 py-4 text-left font-bold text-text-main flex items-center justify-between hover:bg-bg-main transition-colors focus:outline-none">
          <span className="text-sm font-sans">Is Katuwang completely free for TRIS students?</span>
          <svg id="faq-icon-1" style={{ transform: openFaq === 1 ? "rotate(180deg)" : "rotate(0deg)" }} className="w-4 h-4 text-brand-teal transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="faq-answer-1" className={`${openFaq === 1 ? "" : "hidden"} px-5 pb-4 text-text-main/80 font-sans text-xs leading-relaxed border-t border-border-subtle pt-3`}>
          Yes. Katuwang is a non-profit, student-centered peer tutoring platform specifically designed for Taysan Resettlement Integrated School (TRIS). There are no paid tiers or subscription fees.
        </div>
      </div>

      <div className="bg-card-surface paper-border rounded-lg overflow-hidden">
        <button onClick={() => setOpenFaq(openFaq === 2 ? null : 2)} aria-expanded={openFaq === 2} aria-controls="faq-answer-2" className="w-full px-5 py-4 text-left font-bold text-text-main flex items-center justify-between hover:bg-bg-main transition-colors focus:outline-none">
          <span className="text-sm font-sans">Who is eligible to join?</span>
          <svg id="faq-icon-2" style={{ transform: openFaq === 2 ? "rotate(180deg)" : "rotate(0deg)" }} className="w-4 h-4 text-brand-teal transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="faq-answer-2" className={`${openFaq === 2 ? "" : "hidden"} px-5 pb-4 text-text-main/80 font-sans text-xs leading-relaxed border-t border-border-subtle pt-3`}>
          The platform serves enrolled Junior and Senior High School students (Grades 7 through 12) at Taysan Resettlement Integrated School in Legazpi City, Albay.
        </div>
      </div>

      <div className="bg-card-surface paper-border rounded-lg overflow-hidden">
        <button onClick={() => setOpenFaq(openFaq === 3 ? null : 3)} aria-expanded={openFaq === 3} aria-controls="faq-answer-3" className="w-full px-5 py-4 text-left font-bold text-text-main flex items-center justify-between hover:bg-bg-main transition-colors focus:outline-none">
          <span className="text-sm font-sans">How do peer tutors qualify for specific topics?</span>
          <svg id="faq-icon-3" style={{ transform: openFaq === 3 ? "rotate(180deg)" : "rotate(0deg)" }} className="w-4 h-4 text-brand-teal transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="faq-answer-3" className={`${openFaq === 3 ? "" : "hidden"} px-5 pb-4 text-text-main/80 font-sans text-xs leading-relaxed border-t border-border-subtle pt-3`}>
          Tutors must take and pass a topic-specific qualifying assessment managed by school administrators before opening a class for that topic.
        </div>
      </div>

      <div className="bg-card-surface paper-border rounded-lg overflow-hidden">
        <button onClick={() => setOpenFaq(openFaq === 4 ? null : 4)} aria-expanded={openFaq === 4} aria-controls="faq-answer-4" className="w-full px-5 py-4 text-left font-bold text-text-main flex items-center justify-between hover:bg-bg-main transition-colors focus:outline-none">
          <span className="text-sm font-sans">Why are student IDs like STU-0001 used online?</span>
          <svg id="faq-icon-4" style={{ transform: openFaq === 4 ? "rotate(180deg)" : "rotate(0deg)" }} className="w-4 h-4 text-brand-teal transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="faq-answer-4" className={`${openFaq === 4 ? "" : "hidden"} px-5 pb-4 text-text-main/80 font-sans text-xs leading-relaxed border-t border-border-subtle pt-3`}>
          Anonymous IDs ensure compliance with the Philippine Data Privacy Act (RA 10173). Peer users cannot browse real names or personal contact details online. Real names are accessible only to authorized administrators for account approval and safety moderation.
        </div>
      </div>

      <div className="bg-card-surface paper-border rounded-lg overflow-hidden">
        <button onClick={() => setOpenFaq(openFaq === 5 ? null : 5)} aria-expanded={openFaq === 5} aria-controls="faq-answer-5" className="w-full px-5 py-4 text-left font-bold text-text-main flex items-center justify-between hover:bg-bg-main transition-colors focus:outline-none">
          <span className="text-sm font-sans">What happens if no class is available for my topic?</span>
          <svg id="faq-icon-5" style={{ transform: openFaq === 5 ? "rotate(180deg)" : "rotate(0deg)" }} className="w-4 h-4 text-brand-teal transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="faq-answer-5" className={`${openFaq === 5 ? "" : "hidden"} px-5 pb-4 text-text-main/80 font-sans text-xs leading-relaxed border-t border-border-subtle pt-3`}>
          Learners can submit a Topic Request inside the portal. Qualified tutors receive notifications when learners request topics in their subject area, helping them schedule demand-driven sessions.
        </div>
      </div>

    </div>
  </section>

  <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
    <div className="bg-brand-teal text-white rounded-2xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-md">

      <div className="max-w-2xl mx-auto space-y-3 relative z-10">
        <span className="font-mono-ui text-xs tracking-widest uppercase text-white/80 bg-white/10 px-3 py-1 rounded-full inline-block border border-white/20">
          JOIN THE TRIS PEER COMMUNITY
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to learn together on campus?</h2>
        <p className="text-white/80 text-sm sm:text-base leading-relaxed">
          Sign up today as a learner seeking help or apply as a verified tutor to support your school community.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 relative z-10 pt-2 font-mono-ui text-xs">
        <a href="/register/learner" className="px-6 py-3 rounded bg-white text-brand-teal font-bold hover:bg-white/90 transition-all shadow">
          Register as Learner
        </a>
        <a href="/register/tutor" className="px-6 py-3 rounded bg-tutor-gold text-dark-gold-text font-bold hover:bg-tutor-gold/90 transition-all shadow">
          Apply as Tutor
        </a>
      </div>

      <p className="text-[11px] font-mono-ui text-white/60 relative z-10">
        Already have an account? <a href={signedIn ? "/dashboard" : "/login"} className="underline text-white font-semibold">Log in to your portal</a>
      </p>

    </div>
  </section>

  </main>
  <footer className="bg-dark-neutral text-white/80 border-t border-border-subtle py-12 px-4 sm:px-6 font-mono-ui text-xs">
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/10">

      <div className="md:col-span-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-brand-teal flex items-center justify-center text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
          </div>
          <span className="text-base font-bold text-white tracking-tight">Katuwang</span>
        </div>
        <p className="text-[11px] text-white/60 leading-relaxed font-sans max-w-sm">
          A non-profit peer tutoring management system created for Taysan Resettlement Integrated School (TRIS), Legazpi City, Albay, Philippines.
        </p>
        <p className="text-[10px] text-white/40">
          Compliant with RA 10173 (Philippine Data Privacy Act)
        </p>
      </div>

      <div className="md:col-span-3 space-y-2">
        <span className="text-white font-bold text-[11px] block tracking-wider uppercase text-brand-teal">PLATFORM</span>
        <ul className="space-y-1.5 text-white/70">
          <li><a href={signedIn ? "/dashboard" : "/login"} className="hover:text-white transition-colors">Log In</a></li>
          <li><a href="/register/learner" className="hover:text-white transition-colors">Learner Registration</a></li>
          <li><a href="/register/tutor" className="hover:text-white transition-colors">Tutor Application</a></li>
          <li><a href="/dashboard" className="hover:text-white transition-colors">Student Portal</a></li>
        </ul>
      </div>

      <div className="md:col-span-4 space-y-2">
        <span className="text-white font-bold text-[11px] block tracking-wider uppercase text-brand-teal">LOCATION & PRIVACY</span>
        <p className="text-white/60 font-sans text-xs">
          Taysan Resettlement Integrated School<br/>
          Legazpi City, Albay, 4500 Philippines
        </p>
        <div className="pt-2">
          <a href="/privacy-policy" className="text-brand-teal hover:underline text-[11px]">
            Read Platform Privacy Policy →
          </a>
        </div>
      </div>

    </div>

    <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 gap-2">
      <p>© Katuwang TRIS Peer Tutoring. Free & Non-Profit Platform.</p>
      <p>All illustrative student IDs (STU-XXXX / TUT-XXXX) are fictional examples.</p>
    </div>
  </footer>

</div>;
}
