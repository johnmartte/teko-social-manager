import { cn } from "@/lib/utils";

/** Crédito del producto. Cambiar solo aquí. */
export default function PoweredBy({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] leading-snug", className)}>
      Producto desarrollado por{" "}
      <a href="https://teko.do" target="_blank" rel="noopener noreferrer" className="font-semibold underline-offset-2 hover:underline">
        TEKO
      </a>
      <span className="block">Integrado con la API oficial de Meta (Instagram y Facebook)</span>
    </p>
  );
}
