import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      anonymousId: string;
      role: "ADMIN" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
      fullName: string;
      email: string;
    };
  }

  interface User {
    id: string;
    anonymousId: string;
    role: "ADMIN" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
    fullName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    anonymousId: string;
    role: "ADMIN" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
    fullName: string;
  }
}
