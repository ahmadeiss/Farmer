"use client";

/**
 * Auth guard hooks for route protection.
 *
 * useGuestOnly  – redirect authenticated users away from public pages (login/register/home).
 * useAuthGuard  – redirect unauthenticated or wrong-role users away from protected pages.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

type Role = "farmer" | "buyer" | "admin" | "driver";

/** Returns the correct dashboard URL for each role */
export function dashboardFor(role: string): string {
  switch (role) {
    case "farmer": return "/farmer/dashboard";
    case "admin":  return "/admin/dashboard";
    case "driver": return "/driver/dashboard";
    default:       return "/marketplace";
  }
}

/**
 * Redirect authenticated users to their dashboard (or ?next= if present).
 * Use this in login / register / home pages.
 *
 * When an authenticated user lands on /login?next=/orders/confirm/TOKEN
 * (e.g. after scanning a QR code while not yet logged in, then logging in
 * and being bounced back), this hook sends them to the ?next= path instead
 * of their generic dashboard so the QR confirmation completes automatically.
 */
export function useGuestOnly() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated || !user) return;

    // Honor ?next= (safe relative paths only) so QR-scan → login → confirm works
    const next = searchParams.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      router.replace(next);
    } else {
      router.replace(dashboardFor(user.role));
    }
  }, [mounted, isAuthenticated, user, router, searchParams]);

  // True once hydration is done AND the user is a guest (or being redirected)
  const isGuest = mounted && !isAuthenticated;
  return { mounted, isAuthenticated, isGuest, user };
}

/**
 * Protect pages that require authentication and a specific role.
 * Redirects to /login if not authenticated.
 * Redirects to their own dashboard if the role doesn't match.
 */
export function useAuthGuard(requiredRole?: Role) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.replace(dashboardFor(user?.role ?? "buyer"));
    }
  }, [mounted, isAuthenticated, user, requiredRole, router]);

  // True only when auth is confirmed and role matches
  const isReady =
    mounted &&
    isAuthenticated &&
    (!requiredRole || user?.role === requiredRole);

  return { isReady, mounted, isAuthenticated, user };
}
