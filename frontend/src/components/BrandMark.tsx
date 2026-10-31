import { cn } from "@/lib/utils";

/** Identidad del producto. Cambiar solo aquí. */
export default function BrandMark({
  showName = true,
  className,
}: {
  showName?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/teko-social.svg" alt="Teko Social" className="size-9 shrink-0" />
      {showName && (
        <div className="leading-none">
          <span className="block text-[15px] font-semibold tracking-tight">Teko Social</span>
          <span className="block text-[11px] text-sidebar-muted mt-1">Studio</span>
        </div>
      )}
    </div>
  );
}
