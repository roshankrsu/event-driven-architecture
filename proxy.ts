import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhook/register",
  "/sign-up",
  "/sign-in",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();

    // Redirect unauthenticated users away from protected routes
    if (!userId && !isPublicRoute(req)) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    let role: string | undefined;

    if (userId) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = user.publicMetadata.role as string | undefined;
    }

    // Redirect admin users from /dashboard to /admin/dashboard
    if (role === "admin" && req.nextUrl.pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Prevent non-admin users from accessing admin routes
    if (role !== "admin" && req.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect authenticated users away from public routes
    if (userId && isPublicRoute(req)) {
      return NextResponse.redirect(
        new URL(role === "admin" ? "/admin/dashboard" : "/dashboard", req.url),
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/error", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};