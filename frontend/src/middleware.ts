import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/marketplace",
  "/marketplace/",
];

const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};