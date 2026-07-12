import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-canvas font-semibold hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface2 border border-border text-textbright hover:bg-surface3 hover:border-border2",
  ghost: "bg-transparent text-textlabel hover:bg-surface2 hover:text-textbright",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "secondary", className, ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex h-8 select-none items-center justify-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
