import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import dayjs, { Dayjs } from "dayjs";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "./calendar";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  id?: string;
  value?: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

const DatePicker = ({
  id,
  value,
  onChange,
  onClear,
  placeholder = "Velg dato",
  className,
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const selected = value && value.isValid() ? value.toDate() : undefined;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-md border-2 border-slate-border bg-white dark:bg-bark dark:border-slate text-bark dark:text-sand px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <CalendarIcon size={16} className="shrink-0 opacity-50" />
          <span className={cn("truncate flex-1 text-left", !selected && "text-slate")}>
            {selected ? dayjs(selected).format("DD.MM.YYYY") : placeholder}
          </span>
          {onClear && selected && (
            <X
              size={14}
              className="shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            />
          )}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-[1100] rounded-md border-2 border-slate-border dark:border-slate bg-white dark:bg-bark shadow-custom-lg"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              const base = value && value.isValid() ? value : dayjs();
              onChange(
                base
                  .year(date.getFullYear())
                  .month(date.getMonth())
                  .date(date.getDate()),
              );
              setOpen(false);
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

export { DatePicker };
