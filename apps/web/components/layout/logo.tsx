import { cn } from "@/lib/utils";

/* Money Flow brand mark — two flowing lines, inherits currentColor */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Money Flow"
      className={className}
    >
      <path
        d="M5 24.5 Q 12.5 12.5 20 18.5 T 35 12.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M5 31.5 Q 12.5 19.5 20 25.5 T 35 19.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
    </svg>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <LogoMark className="h-7 w-7" />
      <span className="text-md font-semibold tracking-tight">Money Flow</span>
    </span>
  );
}
