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

  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isLoginRoute) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isLoginRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoginRoute, loading, router]);

  if (loading) {
    return <div className="min-h-screen" />;
  }

  if (!isAuthenticated && !isLoginRoute) {
    return <div className="min-h-screen" />;
  }

  if (isLoginRoute) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
        <Header />
        <main className="flex-1 px-5 py-5 sm:px-8 sm:py-7">{children}</main>
      </div>
    </>
  );
}
