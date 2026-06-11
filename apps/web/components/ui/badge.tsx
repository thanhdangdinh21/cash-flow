import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-transparent px-[9px] py-[5px] text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "bg-ink text-paper",
        secondary: "bg-paper-2 text-ink-2",
        outline: "border-line-2 bg-transparent text-ink-2",
        positive: "bg-positive-soft text-positive-2",
        negative: "bg-negative-soft text-negative-2",
        warning: "bg-warning-soft text-warning",
        info: "bg-info-soft text-info",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
