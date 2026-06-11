import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-line-2 bg-surface px-4 text-base text-ink transition-[background-color,border-color,color,box-shadow] duration-[120ms] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-4 hover:border-line-strong focus-visible:border-ink-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-paper-2 disabled:text-ink-4",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
