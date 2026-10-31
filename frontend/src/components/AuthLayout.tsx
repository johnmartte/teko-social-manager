import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PoweredBy from "@/components/PoweredBy";

// Fotos de Pexels (licencia libre) que rotan solas en el panel izquierdo.
const px = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1400`;
const PHOTOS = [13929970, 8303428, 8117815, 15555796].map(px);
const CYCLE = 6; // segundos por foto

/** Acceso a dos paneles: foto a la izquierda, formulario de vidrio oscuro a la derecha. Siempre oscuro. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark auth-scope relative min-h-screen bg-[#0b0b0c] text-foreground overflow-hidden" data-theme="dark">
      {/* luz cálida que sale de la foto hacia el formulario */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[22%] top-1/2 -translate-y-1/2 size-[900px] rounded-full opacity-60"
        style={{ background: "radial-gradient(closest-side, rgba(176,112,72,.28), transparent)" }}
      />

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 p-3 sm:p-5">
        <div className="relative hidden lg:block rounded-[28px] overflow-hidden border border-white/10">
          {PHOTOS.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="auth-slide absolute inset-0 size-full object-cover"
              style={{
                animationDuration: `${CYCLE * PHOTOS.length}s`,
                animationDelay: `${i * CYCLE}s`,
                opacity: i === 0 ? 1 : 0,
              }}
            />
          ))}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden>
            {PHOTOS.map((src, i) => (
              <span
                key={src}
                className="auth-dot h-1 w-6 rounded-full bg-white/25"
                style={{ animationDuration: `${CYCLE * PHOTOS.length}s`, animationDelay: `${i * CYCLE}s` }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
          <div className="absolute top-7 left-7 text-white">
            <BrandMark />
          </div>
          <div className="absolute bottom-8 left-7 right-7 text-white">
            <p className="text-[28px] leading-[1.15] font-semibold tracking-tight max-w-md">
              Tu feed, planeado antes de que salga la cámara.
            </p>
            <p className="mt-4 mb-4 text-[11px] text-white/50">Fotos: Pexels</p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-3 sm:px-10 py-10">
          <div className="w-full max-w-[380px] mx-auto">
            <div className="lg:hidden mb-10">
              <BrandMark />
            </div>
            {children}
            <PoweredBy className="mt-10 text-center text-white/40" />
          </div>
        </div>
      </div>

      {/* enlaces legales visibles para Meta y para cualquier usuario antes de entrar */}
      <div className="absolute bottom-4 right-6 flex gap-4 text-[11px] text-white/50">
        <Link href="/privacy" className="hover:text-white">Privacidad</Link>
        <Link href="/data-deletion" className="hover:text-white">Eliminación de datos</Link>
      </div>
    </div>
  );
}
