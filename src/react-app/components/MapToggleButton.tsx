import { Button } from "./ui/button";
import { glassSurface } from "../lib/glass";
import type { LucideIcon } from "lucide-react";

interface MapToggleButtonProps {
  icon: LucideIcon;
  label: string;
  pressed: boolean;
  onClick: () => void;
}

export function MapToggleButton({
  icon: Icon,
  label,
  pressed,
  onClick,
}: MapToggleButtonProps) {
  return (
    <div className="relative group">
      <span className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-sand/95 dark:bg-bark/95 px-3 py-1.5 text-sm font-medium text-bark dark:text-sand shadow-custom-lg border border-moss/30 opacity-0 translate-x-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
        {label}
      </span>
      <Button
        onClick={onClick}
        size="icon"
        variant="ghost"
        aria-pressed={pressed}
        aria-label={label}
        title={label}
        className={`h-12 w-12 box-border active:scale-95 ${
          pressed
            ? "bg-moss text-sand border border-moss shadow-custom-xl hover:bg-forest hover:text-sand"
            : `${glassSurface} text-bark dark:text-sand hover:bg-white/90 dark:hover:bg-bark/90`
        }`}
      >
        <Icon size={20} />
      </Button>
    </div>
  );
}
