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
      className={`teko-card p-5 ${className}`}
      style={color ? { borderLeftColor: color, borderLeftWidth: 3 } : undefined}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
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
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="teko-card p-4 flex flex-col gap-1 min-w-0">
      {icon && <div className="text-muted-foreground mb-1">{icon}</div>}
      <p className="text-xl font-semibold leading-tight truncate tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}
