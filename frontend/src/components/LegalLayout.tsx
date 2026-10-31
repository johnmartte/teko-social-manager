import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import PoweredBy from "@/components/PoweredBy";

/** Páginas legales públicas (Meta las exige sin login). Mismo look oscuro que el acceso. */
export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dark auth-scope relative min-h-screen bg-[#0b0b0c] text-foreground overflow-hidden" data-theme="dark">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-40 -translate-x-1/2 size-[900px] rounded-full opacity-60"
        style={{ background: "radial-gradient(closest-side, rgba(176,112,72,.28), transparent)" }}
      />
      <div className="relative mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <BrandMark />
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="size-4" /> Volver al inicio
          </Link>
        </header>

        <main className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h1>
          {updated && <p className="mt-2 text-xs text-white/50">Última actualización: {updated}</p>}
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-white/75 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_a]:text-[#d9a47a] [&_a]:underline [&_a]:underline-offset-2">
            {children}
          </div>
        </main>

        <footer className="mt-6 flex justify-center gap-5 text-xs text-white/50">
          <Link href="/privacy" className="hover:text-white">Privacidad</Link>
          <Link href="/data-deletion" className="hover:text-white">Eliminación de datos</Link>
        </footer>
        <PoweredBy className="mt-4 text-center text-white/40" />
      </div>
    </div>
  );
}
