import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  color?: string;
};

export default function Card({
  title,
  action,
  children,
  className = "",
  color,
}: CardProps) {
  return (
    <div
      className={`bg-card/95 rounded-3xl border border-border p-5 shadow-[0_16px_42px_rgba(67,54,27,0.08)] ${className}`}
      style={color ? { borderLeftColor: color, borderLeftWidth: 3 } : undefined}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-card/95 rounded-3xl border border-border px-5 py-6 flex items-center gap-4 shadow-[0_16px_36px_rgba(67,54,27,0.07)]">
      {icon && (
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color ? `${color}20` : "#f5f2ec" }}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}
