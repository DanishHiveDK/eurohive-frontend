export { Button } from "./button";

// Re-export all UI components from this index
// Each component below is defined inline for the scaffold;
// extract to separate files as the codebase grows.

import { cn, getInitials } from "@/lib/utils";
import type { ReactNode } from "react";

// ── Badge ────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "muted";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-honey/10 text-honey-600",
  success: "bg-success-light text-success-dark",
  warning: "bg-warning-light text-warning-dark",
  error: "bg-error-light text-error-dark",
  info: "bg-info-light text-info-dark",
  muted: "bg-cream-100 text-midnight-400",
};

export function Badge({
  children,
  variant = "default",
  dot = false,
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "badge",
        badgeVariants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "error" && "bg-error",
            variant === "info" && "bg-info",
            variant === "default" && "bg-honey",
            variant === "muted" && "bg-cream-300"
          )}
        />
      )}
      {children}
    </span>
  );
}

// ── Avatar ───────────────────────────────────────────────────

export function Avatar({
  name,
  src,
  size = "md",
  online,
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-lg" };
  const dotSizes = { sm: "w-2 h-2", md: "w-2.5 h-2.5", lg: "w-3 h-3", xl: "w-3.5 h-3.5" };
  const initials = getInitials(name);

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(sizes[size], "rounded-xl object-cover")}
        />
      ) : (
        <div
          className={cn(
            sizes[size],
            "rounded-xl bg-gradient-to-br from-honey/20 to-honey/40",
            "flex items-center justify-center font-bold text-honey-700"
          )}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <div
          className={cn(
            dotSizes[size],
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
            online ? "bg-success" : "bg-cream-300"
          )}
        />
      )}
    </div>
  );
}

// ── Stars ────────────────────────────────────────────────────

export function Stars({
  rating,
  size = "sm",
  className,
}: {
  rating: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const textSizes = { xs: "text-[10px]", sm: "text-xs", md: "text-sm" };
  return (
    <span className={cn("inline-flex gap-0.5", textSizes[size], className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= Math.round(rating) ? "text-amber-400" : "text-cream-200"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ── Card ─────────────────────────────────────────────────────

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}) {
  const paddings = { none: "", sm: "p-3", md: "p-5", lg: "p-6" };
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-cream-200 shadow-card transition-all duration-200",
        hover && "hover:shadow-card-hover hover:border-honey/20 cursor-pointer",
        paddings[padding],
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  trend,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
  trend?: number;
}) {
  return (
    <Card>
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-2xs font-semibold text-midnight-300 uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <div className="text-xl font-bold text-midnight font-serif mb-0.5">
        {value}
      </div>
      <div className="flex items-center gap-1.5">
        {trend !== undefined && (
          <span
            className={cn(
              "text-2xs font-semibold",
              trend > 0 ? "text-success" : "text-error"
            )}
          >
            {trend > 0 ? "↑" : "↓"}
            {Math.abs(trend)}%
          </span>
        )}
        {subtitle && (
          <span className="text-2xs text-midnight-200">{subtitle}</span>
        )}
      </div>
    </Card>
  );
}

// ── ProgressBar ──────────────────────────────────────────────

export function ProgressBar({
  value,
  max,
  color = "honey",
  className,
}: {
  value: number;
  max: number;
  color?: "honey" | "success" | "info" | "error";
  className?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const colors = {
    honey: "from-honey to-honey-300",
    success: "from-success to-emerald-400",
    info: "from-info to-blue-400",
    error: "from-error to-red-400",
  };

  return (
    <div className={cn("w-full h-1.5 rounded-full bg-cream-100", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-all duration-500",
          colors[color]
        )}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}
