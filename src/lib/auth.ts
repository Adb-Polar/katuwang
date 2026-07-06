import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No account found with that email.");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("Incorrect password.");
        }

        return {
          id: user.id,
          anonymousId: user.anonymousId,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
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
        token.fullName = user.fullName;
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
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",           // Custom login page
    error: "/login",            // Redirect auth errors to login page
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,       // 8 hours (school-day-length sessions)
  },

  secret: process.env.NEXTAUTH_SECRET,
};
