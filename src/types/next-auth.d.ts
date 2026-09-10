import NextAuth from "next-auth";

type AccountStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING" | "DECLINED";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      anonymousId: string;
      role: "ADMIN" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
      fullName: string;
      email: string;
      status: AccountStatus;
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
    status: AccountStatus;
    /** Epoch ms of the last DB re-sync of `role`/`status`. */
    checkedAt: number;
  }
}
