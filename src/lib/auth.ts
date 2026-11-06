import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { rateLimit, rateLimitEnabled, clientIp } from "./rateLimit";
import { getSetting } from "./settings";

// A real bcrypt hash (cost 12) of a throwaway string keeps missing-account
// requests comparable in cost to wrong-password requests.
const DUMMY_PASSWORD_HASH = "$2b$12$IoGXJ6Gc974qVtoXzHgX0ON1saFbEG.vkr3Fz2b44U45Ct9uLiaLK";

// How long a decoded JWT's cached role/status is trusted before the `jwt`
// callback re-reads them from the DB for client/proxy display. Protected server
// operations independently check the live account on every request.
const TOKEN_STALE_MS = 5 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        // Throttle sign-in attempts per IP+email to blunt password spraying /
        // credential stuffing. Skipped under tests and when `req` is absent.
        if (rateLimitEnabled() && req?.headers) {
          const ip = clientIp(req.headers as Record<string, string | string[] | undefined>);
          const limited = rateLimit(`login:${ip}:${credentials.email}`, 10, 10 * 60 * 1000);
          if (!limited.ok) {
            throw new Error("Too many sign-in attempts. Please wait a few minutes and try again.");
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // Keep response time comparable even though field feedback differs.
          await bcrypt.compare(credentials.password, DUMMY_PASSWORD_HASH);
          throw new Error("EMAIL_NOT_FOUND");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("INCORRECT_PASSWORD");
        }

        if (user.status === "SUSPENDED" && user.statusExpiresAt && user.statusExpiresAt <= new Date()) {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: "ACTIVE", statusReason: null, statusUpdatedAt: new Date(), statusExpiresAt: null },
          });
          user.status = "ACTIVE";
        }

        if (user.status === "SUSPENDED") {
          throw new Error("Your account has been suspended. Contact an administrator for details.");
        }

        if (user.status === "BANNED") {
          throw new Error("Your account has been banned.");
        }

        // Verification is checked before approval/pending status — a user who
        // hasn't confirmed their email shouldn't be told their account is
        // "pending admin review", which implies verification already happened.
        if (!user.emailVerifiedAt) {
          const globallyRequired = await getSetting("requireEmailVerification");
          // Signup-only enforcement preserves access for legacy accounts that
          // never received a verification token. Expired tokens still require
          // verification; the user can request a fresh code.
          const signupRequired = process.env.REQUIRE_SIGNUP_EMAIL_VERIFICATION === "true" &&
            Boolean(await prisma.verificationToken.findFirst({
              where: { userId: user.id },
              select: { id: true },
            }));
          if (globallyRequired || signupRequired) {
            throw new Error("ACCOUNT_UNVERIFIED");
          }
        }

        if (user.status === "PENDING") {
          // Sentinel — LoginForm redirects this to the /pending-approval page
          // instead of showing it as an inline error.
          throw new Error("ACCOUNT_PENDING");
        }

        if (user.status === "DECLINED") {
          // Sentinel (+ optional reason after the first ":") — LoginForm
          // redirects this to /account-declined, which surfaces the reason.
          throw new Error(
            user.statusReason ? `ACCOUNT_DECLINED:${user.statusReason}` : "ACCOUNT_DECLINED"
          );
        }

        return {
          id: user.id,
          anonymousId: user.anonymousId,
          email: user.email,
          role: user.role,
          fullName: `${user.firstName} ${user.lastName}`.trim(),
          ...(user.image ? { image: user.image } : {}),
          gradeLevel: user.gradeLevel,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On sign in, attach user data to the JWT
      if (user) {
        token.id = user.id;
        token.anonymousId = user.anonymousId;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
        token.fullName = user.fullName;
        if (user.image) token.image = user.image;
        if (user.gradeLevel) token.gradeLevel = user.gradeLevel;
        token.status = "ACTIVE";
        token.checkedAt = Date.now();
        return token;
      }

      // On later requests, periodically re-sync role + account status from the
      // DB so a suspend/ban/role change doesn't wait out the 8h session.
      if (token.id && (!token.checkedAt || Date.now() - token.checkedAt > TOKEN_STALE_MS)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, status: true, image: true, gradeLevel: true, sessionVersion: true },
        });
        token.checkedAt = Date.now();
        // Never adopt a changed role into an existing login. The live server
        // boundary rejects mismatches immediately; the proxy catches up here.
        token.status = fresh && fresh.role === token.role &&
          typeof token.sessionVersion === "number" && fresh.sessionVersion === token.sessionVersion
          ? fresh.status : "BANNED";
        if (fresh) {
          token.image = fresh.image ?? null;
          token.gradeLevel = fresh.gradeLevel ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Expose safe user data to the client session
      if (token) {
        session.user.id = token.id;
        session.user.anonymousId = token.anonymousId;
        session.user.role = token.role;
        session.user.fullName = token.fullName;
        session.user.status = token.status ?? "ACTIVE";
        session.user.sessionVersion = token.sessionVersion;
        session.user.image = token.image ?? null;
        session.user.gradeLevel = token.gradeLevel ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",           // Custom login page
    signOut: "/logout",         // Custom, app-styled sign-out confirmation
    error: "/login",            // Redirect auth errors to login page
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,       // 8 hours (school-day-length sessions)
  },

  secret: process.env.NEXTAUTH_SECRET,
};
