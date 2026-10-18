import NextAuth from "next-auth";

type AccountStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING" | "DECLINED";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      anonymousId: string;
      role: "SUPER_ADMIN" | "ADMIN" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
      fullName: string;
      email: string;
      status: AccountStatus;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    anonymousId: string;
    role: "SUPER_ADMIN" | "ADMIN" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
    fullName: string;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    anonymousId: string;
    role: "SUPER_ADMIN" | "ADMIN" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
    fullName: string;
    status: AccountStatus;
    image?: string | null;
    /** Epoch ms of the last DB re-sync of `role`/`status`. */
    checkedAt: number;
  }
}
