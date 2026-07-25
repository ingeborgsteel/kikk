import * as React from "react";
import { cn } from "../../lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Render without the boxy chrome, for use inside dense contexts like table cells. */
  variant?: "default" | "ghost";
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          variant === "ghost"
            ? "flex h-full w-full rounded-none bg-transparent px-2 py-1.5 text-sm text-bark dark:text-sand ring-0 outline-none placeholder:text-slate focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 max-w-full"
            : "flex h-10 w-full rounded-md border-2 border-slate-border bg-white dark:bg-bark dark:border-slate text-bark dark:text-sand px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-full",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
