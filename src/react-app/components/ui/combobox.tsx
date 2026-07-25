import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
}

interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  customEntryLabel?: (input: string) => string;
  className?: string;
  /** Render without the boxy trigger chrome, for use inside dense contexts like table cells. */
  variant?: "default" | "ghost";
  /** Open the popover as soon as this mounts, e.g. for click-to-edit table cells. */
  defaultOpen?: boolean;
  /** Fires whenever the popover opens/closes, so a caller can e.g. exit edit mode on close. */
  onOpenChange?: (open: boolean) => void;
}

const Combobox = ({
  id,
  value,
  onChange,
  options,
  placeholder = "Velg...",
  searchPlaceholder = "Søk...",
  emptyText = "Ingen treff",
  customEntryLabel = (input) => `Bruk "${input}"`,
  className,
  variant = "default",
  defaultOpen = false,
  onOpenChange,
}: ComboboxProps) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const [search, setSearch] = React.useState("");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
    onOpenChange?.(next);
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? value;

  const trimmedSearch = search.trim();
  const exactMatch = options.some(
    (opt) => opt.value.toLowerCase() === trimmedSearch.toLowerCase(),
  );
  const showCustomEntry = trimmedSearch.length > 0 && !exactMatch;

  const groups = React.useMemo(() => {
    const map = new Map<string | undefined, ComboboxOption[]>();
    for (const opt of options) {
      const key = opt.group;
      const list = map.get(key) ?? [];
      list.push(opt);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [options]);

  const commit = (next: string) => {
    onChange(next);
    setSearch("");
    setOpen(false);
    onOpenChange?.(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            variant === "ghost"
              ? "flex h-full w-full items-center justify-between gap-1 rounded-none bg-transparent px-2 py-1.5 text-sm text-bark dark:text-sand outline-none focus-visible:outline-none focus-visible:ring-0"
              : "flex h-10 w-full items-center justify-between rounded-md border-2 border-slate-border bg-white dark:bg-bark dark:border-slate text-bark dark:text-sand px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span
            className={cn("truncate text-left", !displayLabel && "text-slate")}
          >
            {displayLabel || placeholder}
          </span>
          {variant !== "ghost" && (
            <ChevronDown size={16} className="shrink-0 opacity-50 ml-2" />
          )}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-[1100] w-[var(--radix-popover-trigger-width)] rounded-md border-2 border-slate-border dark:border-slate bg-white dark:bg-bark shadow-custom-lg overflow-hidden"
        >
          <CommandPrimitive shouldFilter={false} className="flex flex-col">
            <CommandPrimitive.Input
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 text-sm bg-transparent border-b border-slate-border dark:border-slate text-bark dark:text-sand placeholder:text-slate focus:outline-none"
            />
            <CommandPrimitive.List className="max-h-60 overflow-y-auto p-1">
              {groups.map(([group, opts]) => {
                const filtered = search
                  ? opts.filter((opt) =>
                      opt.label.toLowerCase().includes(search.toLowerCase()),
                    )
                  : opts;
                if (filtered.length === 0) return null;
                return (
                  <CommandPrimitive.Group
                    key={group ?? "__default"}
                    heading={group}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-slate"
                  >
                    {filtered.map((opt) => (
                      <CommandPrimitive.Item
                        key={opt.value}
                        value={opt.value}
                        onSelect={() => commit(opt.value)}
                        className="flex items-center justify-between px-2 py-2 text-sm rounded-md cursor-pointer text-bark dark:text-sand data-[selected=true]:bg-sand dark:data-[selected=true]:bg-forest"
                      >
                        <span>{opt.label}</span>
                        {opt.value === value && (
                          <Check size={14} className="shrink-0" />
                        )}
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                );
              })}
              {showCustomEntry && (
                <CommandPrimitive.Item
                  value={`__custom__${trimmedSearch}`}
                  onSelect={() => commit(trimmedSearch)}
                  className="flex rounded-md items-center px-2 py-2 text-sm cursor-pointer text-bark dark:text-sand data-[selected=true]:bg-sand dark:data-[selected=true]:bg-forest"
                >
                  {customEntryLabel(trimmedSearch)}
                </CommandPrimitive.Item>
              )}
              {!showCustomEntry && (
                <CommandPrimitive.Empty className="px-2 py-4 text-sm text-slate text-center">
                  {emptyText}
                </CommandPrimitive.Empty>
              )}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

export { Combobox };
