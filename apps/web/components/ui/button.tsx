import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow,transform] duration-[120ms] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "bg-action-primary text-action-primary-fg hover:bg-action-primary-hover active:bg-action-primary-press active:scale-[0.985]",
        outline:
          "border border-line-2 bg-surface text-ink hover:bg-hover-ink active:bg-press-ink active:scale-[0.985]",
        ghost: "text-ink hover:bg-hover-ink active:bg-press-ink",
        danger:
          "bg-negative text-white hover:bg-negative-2 active:scale-[0.985]",
        link: "text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-base",
        sm: "h-9 px-4 text-sm",
        lg: "h-[54px] rounded-lg px-6 text-md",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
