import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Menu } from "lucide-react";
import { NavMenuItemDef, useNavMenuItems } from "../hooks/useNavMenuItems";
import { Button } from "./ui/button";

function ToggleSwitch({ active }: { active: boolean }) {
  return (
    <span
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
        active ? "bg-moss" : "bg-bark/20 dark:bg-sand/20"
      }`}
      aria-hidden="true"
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
          active ? "left-[18px]" : "left-0.5"
        }`}
      />
    </span>
  );
}

function NavMenuItem({
  item,
  onSelect,
}: {
  item: NavMenuItemDef;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      role={item.active !== undefined ? "switch" : undefined}
      aria-checked={item.active}
      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-bark dark:text-sand hover:bg-moss/10 dark:hover:bg-moss/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
    >
      {item.icon}
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rust px-1 text-xs font-bold text-sand">
          {item.badge}
        </span>
      )}
      {item.active !== undefined && <ToggleSwitch active={item.active} />}
    </button>
  );
}

/**
 * Desktop dropdown menu for all app navigation — shown in the header on every
 * page. On mobile, navigation lives in the BottomNav "Meny" item (/menu page)
 * instead. Item definitions are shared via useNavMenuItems().
 */
export function NavMenu() {
  const [open, setOpen] = useState(false);
  const { destinations, settings, account, feedback } = useNavMenuItems();

  const select = (item: NavMenuItemDef) => {
    setOpen(false);
    item.action();
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="secondary"
          className="hidden md:inline-flex"
          aria-label="Meny"
          title="Meny"
        >
          <Menu size={16} />
          Meny
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={4}
          className="z-[1100] w-56 rounded-md border-2 border-moss bg-white dark:bg-bark shadow-custom-lg overflow-hidden p-1"
        >
          {destinations.map((item) => (
            <NavMenuItem
              key={item.label}
              item={item}
              onSelect={() => select(item)}
            />
          ))}
          <div className="my-1 border-t border-moss/30" />
          {settings.map((item) => (
            <NavMenuItem
              key={item.label}
              item={item}
              onSelect={() => select(item)}
            />
          ))}
          <div className="my-1 border-t border-moss/30" />
          {account.map((item) => (
            <NavMenuItem
              key={item.label}
              item={item}
              onSelect={() => select(item)}
            />
          ))}
          <div className="my-1 border-t border-moss/30" />
          {feedback.map((item) => (
            <NavMenuItem
              key={item.label}
              item={item}
              onSelect={() => select(item)}
            />
          ))}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
