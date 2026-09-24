import { cn } from "@/lib/utils";

// Site-standard pill button: hero's sizing (h-12 px-6) + the text-roll hover
// (duplicate label slides up through an overflow mask, pure CSS).
const VARIANTS = {
  solid: "bg-brand text-brand-foreground hover:bg-brand/90",
  outline: "border border-border bg-background hover:bg-muted",
} as const;

export function RollLink({
  label,
  variant = "solid",
  arrow = false,
  className,
  ...props
}: Omit<React.ComponentProps<"a">, "children"> & {
  label: string;
  variant?: keyof typeof VARIANTS;
  arrow?: boolean;
}) {
  return (
    <a
      {...props}
      className={cn(
        "group inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium transition-colors",
        VARIANTS[variant],
        className,
      )}
    >
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full group-focus-visible:-translate-y-full">
          {label}
        </span>
        <span
          aria-hidden
          className="absolute top-full left-0 block transition-transform duration-300 ease-out group-hover:-translate-y-full group-focus-visible:-translate-y-full"
        >
          {label}
        </span>
      </span>
      {arrow && (
        <svg
          aria-hidden
          viewBox="0 0 8 8"
          className="size-[0.7em] shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M1 7 7 1M2.5 1H7v4.5" />
        </svg>
      )}
    </a>
  );
}
