import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const { token } = req.nextauth;
    const pathname = req.nextUrl.pathname;

    // Role-based route guards
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (
      pathname.startsWith("/moderator") &&
      token?.role !== "TEACHER_MODERATOR" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (
      pathname.startsWith("/tutor") &&
      token?.role !== "STUDENT_TUTOR"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (
      pathname.startsWith("/learner") &&
      token?.role !== "STUDENT_LEARNER"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,  // Must be authenticated
    },
  }
);

// Apply proxy (middleware) to these routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/moderator/:path*",
    "/tutor/:path*",
    "/learner/:path*",
  ],
};
