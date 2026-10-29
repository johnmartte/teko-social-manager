import BrandMark from "@/components/BrandMark";

// Foto de Pexels (licencia libre). Cambiar aquí si se quiere otra.
const PHOTO =
  "https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&cs=tinysrgb&w=1400";

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PHOTO} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
          <div className="absolute top-7 left-7 text-white">
            <BrandMark />
          </div>
          <div className="absolute bottom-8 left-7 right-7 text-white">
            <p className="text-[28px] leading-[1.15] font-semibold tracking-tight max-w-md">
              Planifica tu feed, ordénalo y publícalo sin salir de aquí.
            </p>
            <p className="mt-4 text-[11px] text-white/50">Foto: Pexels</p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-3 sm:px-10 py-10">
          <div className="w-full max-w-[380px] mx-auto">
            <div className="lg:hidden mb-10">
              <BrandMark />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
