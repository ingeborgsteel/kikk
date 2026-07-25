import { useEffect, useRef } from "react";
import { Dayjs } from "dayjs";
import { Clock } from "lucide-react";
import { Input } from "./input";
import { cn } from "../../lib/utils";

interface TimePickerProps {
  id?: string;
  value?: Dayjs | null;
  onChange: (hour: number, minute: number) => void;
  className?: string;
  /** Render without the boxy input chrome, for use inside dense contexts like table cells. */
  variant?: "default" | "ghost";
  /** Focus (and try to open the native time picker) as soon as this mounts. */
  autoOpen?: boolean;
}

const TimePicker = ({
  id,
  value,
  onChange,
  className,
  variant = "default",
  autoOpen = false,
}: TimePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeValue = value && value.isValid() ? value.format("HH:mm") : "";

  useEffect(() => {
    if (!autoOpen) return;
    // Only focus — showPicker() requires an active user gesture and throws
    // when called from an effect (which runs a tick after the click that
    // triggered the mount).
    inputRef.current?.focus();
  }, [autoOpen]);

  return (
    <div className={cn("relative", className)}>
      {variant !== "ghost" && (
        <Clock
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
        />
      )}
      <Input
        ref={inputRef}
        id={id}
        type="time"
        variant={variant}
        value={timeValue}
        onChange={(e) => {
          const [hour, minute] = e.target.value.split(":").map(Number);
          if (Number.isNaN(hour) || Number.isNaN(minute)) return;
          onChange(hour, minute);
        }}
        className={
          variant === "ghost"
            ? "hover:bg-sand/60 dark:hover:bg-forest/60"
            : "pl-8"
        }
      />
    </div>
  );
};

export { TimePicker };
