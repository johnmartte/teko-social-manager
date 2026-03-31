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
      className={`bg-card rounded-2xl border border-border p-5 ${className}`}
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
    <div className="bg-card rounded-2xl border border-border p-5 flex items-start gap-4">
      {icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
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
