import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-forex-border bg-white/5 px-4 py-3 text-base md:text-sm text-forex-text outline-none transition duration-200 placeholder:text-forex-muted/70 focus:border-forex-mint/60 focus:bg-white/7 appearance-none",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
