import { cn } from "@/lib/utils";

/**
 * Identidad del producto. Placeholder neutro: este producto tendrá su propio
 * logo y estética, independientes de la marca corporativa. Cambiar solo aquí.
 */
export default function BrandMark({
  showName = true,
  className,
}: {
  showName?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="size-7 rounded-md bg-foreground/90 flex items-center justify-center shrink-0">
        <span className="text-background text-[13px] font-semibold leading-none">S</span>
      </div>
      {showName && (
        <span className="text-[14px] font-medium tracking-tight">Social Manager</span>
      )}
    </div>
  );
}
