import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only identity-requiring routes gate on sign-in. Core demo flows (/demo/*, /, /docs)
// must stay open to anonymous visitors — see CLAUDE.md hard rule 6.
const isProtectedRoute = createRouteMatcher(["/account(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
