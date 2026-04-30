import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b bg-background/60 px-4 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-8",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 p-4 lg:p-8", className)}>{children}</div>
  );
}

export function StockBadge({
  stock,
  minStock,
}: {
  stock: number;
  minStock: number;
}) {
  let label = "Aman";
  let cls = "bg-success/15 text-success";
  if (stock <= 0) {
    label = "Habis";
    cls = "bg-destructive/15 text-destructive";
  } else if (stock <= minStock) {
    label = "Menipis";
    cls = "bg-warning/15 text-warning";
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        cls
      )}
    >
      {label}
    </span>
  );
}
