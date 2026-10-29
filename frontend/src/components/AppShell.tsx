"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  const isPublicRoute = pathname === "/privacy" || pathname === "/data-deletion"; // requeridas por Meta, sin login

  useEffect(() => {
    if (loading || isPublicRoute) return;

    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isAuthRoute, isPublicRoute, loading, router]);

  if (isPublicRoute) return <main className="min-h-screen w-full">{children}</main>;

  if (loading) {
    return <div className="min-h-screen bg-frame" />;
  }

  if (!isAuthenticated && !isAuthRoute) {
    return <div className="min-h-screen bg-frame" />;
  }

  if (isAuthRoute) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // Marco tipo "app de escritorio": la navegación vive sobre el marco y el contenido en un panel inset.
  return (
    <div className="flex min-h-screen bg-frame p-2 gap-2">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col rounded-[22px] bg-background border border-border overflow-hidden">
        <Header />
        <main className="flex-1 px-4 py-6 sm:px-7">{children}</main>
      </div>
    </div>
  );
}
