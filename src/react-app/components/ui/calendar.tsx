import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { nb } from "react-day-picker/locale";
import { cn } from "../../lib/utils";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

const Calendar = ({ className, classNames, ...props }: CalendarProps) => {
  return (
    <DayPicker
      locale={nb}
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-2",
        month: "flex flex-col gap-2",
        month_caption: "flex justify-center items-center h-9 relative",
        caption_label: "text-sm font-medium text-bark dark:text-sand",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 h-9 px-1",
        button_previous:
          "inline-flex items-center justify-center h-7 w-7 rounded-md text-slate hover:bg-sand hover:text-bark dark:hover:bg-forest dark:hover:text-sand transition-colors disabled:opacity-30",
        button_next:
          "inline-flex items-center justify-center h-7 w-7 rounded-md text-slate hover:bg-sand hover:text-bark dark:hover:bg-forest dark:hover:text-sand transition-colors disabled:opacity-30",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-slate text-xs font-medium w-9 h-9 flex items-center justify-center",
        week: "flex w-full",
        day: "p-0 text-center",
        day_button:
          "h-9 w-9 rounded-md text-sm text-bark dark:text-sand hover:bg-sand dark:hover:bg-forest transition-colors flex items-center justify-center",
        today: "font-semibold text-rust",
        selected:
          "[&>button]:bg-moss [&>button]:text-white [&>button]:hover:bg-moss dark:[&>button]:hover:bg-moss",
        outside: "text-slate/40",
        disabled: "text-slate/30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          ),
      }}
      {...props}
    />
  );
};

export { Calendar };
