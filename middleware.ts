import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/meeting/:path*",
    "/decision-records/:path*",
    "/decisions/:path*",
    "/daily/:path*",
    "/activity-records/:path*",
    "/settings/:path*",
  ],
};