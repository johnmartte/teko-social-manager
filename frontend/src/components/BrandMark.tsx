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
      <div className="relative size-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-[inset_0_-2px_0_rgba(0,0,0,.18)]">
        <svg viewBox="0 0 24 24" className="size-[18px] text-primary-foreground" fill="none" aria-hidden>
          <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
          <rect x="13" y="3" width="8" height="8" rx="4" fill="currentColor" opacity=".55" />
          <rect x="3" y="13" width="8" height="8" rx="4" fill="currentColor" opacity=".55" />
          <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" />
        </svg>
      </div>
      {showName && (
        <div className="leading-none">
          <span className="block text-[15px] font-semibold tracking-tight">Teko Social</span>
          <span className="block text-[11px] text-sidebar-muted mt-1">Studio</span>
        </div>
      )}
    </div>
  );
}
