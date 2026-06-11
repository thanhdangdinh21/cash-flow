"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-7 w-[46px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-45 data-[state=checked]:bg-positive data-[state=unchecked]:bg-line-2",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-[22px] w-[22px] rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-(--ease-spring) data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
