import * as React from "react";
import { cn } from "../../lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Render without the boxy chrome, for use inside dense contexts like table cells. */
  variant?: "default" | "ghost";
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <textarea
        className={cn(
          variant === "ghost"
            ? "flex w-full rounded-none bg-transparent px-2 py-1.5 text-sm text-bark dark:text-sand outline-none placeholder:text-slate focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
            : "flex min-h-[80px] w-full rounded-md border-2 border-slate-border bg-white dark:bg-bark dark:border-slate text-bark dark:text-sand px-3 py-2 text-sm ring-offset-white placeholder:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
