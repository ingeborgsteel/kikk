import { Dayjs } from "dayjs";
import { Clock } from "lucide-react";
import { Input } from "./input";
import { cn } from "../../lib/utils";

interface TimePickerProps {
  id?: string;
  value?: Dayjs | null;
  onChange: (hour: number, minute: number) => void;
  className?: string;
}

const TimePicker = ({ id, value, onChange, className }: TimePickerProps) => {
  const timeValue =
    value && value.isValid() ? value.format("HH:mm") : "";

  return (
    <div className={cn("relative", className)}>
      <Clock
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
      />
      <Input
        id={id}
        type="time"
        value={timeValue}
        onChange={(e) => {
          const [hour, minute] = e.target.value.split(":").map(Number);
          if (Number.isNaN(hour) || Number.isNaN(minute)) return;
          onChange(hour, minute);
        }}
        className="pl-8"
      />
    </div>
  );
};

export { TimePicker };
