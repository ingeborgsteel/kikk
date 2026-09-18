import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Menu } from "lucide-react";
import { NavMenuItemDef, useNavMenuItems } from "../hooks/useNavMenuItems";
import { Button } from "./ui/button";

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
      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-bark dark:text-sand hover:bg-moss/10 dark:hover:bg-moss/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
    >
      {item.icon}
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rust px-1 text-xs font-bold text-sand">
          {item.badge}
        </span>
      )}
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
  const { destinations, account, feedback } = useNavMenuItems();

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
