import { ChevronRight, ExternalLink } from "lucide-react";
import { NavMenuItemDef, useNavMenuItems } from "../hooks/useNavMenuItems";
import Header from "./Header.tsx";

function ToggleSwitch({ active }: { active: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        active ? "bg-moss" : "bg-bark/20 dark:bg-sand/20"
      }`}
      aria-hidden="true"
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          active ? "left-[22px]" : "left-0.5"
        }`}
      />
    </span>
  );
}

function MenuRow({ item }: { item: NavMenuItemDef }) {
  return (
    <button
      onClick={item.action}
      role={item.active !== undefined ? "switch" : undefined}
      aria-checked={item.active}
      className="flex w-full items-center gap-3 p-4 bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 text-bark dark:text-sand hover:border-moss transition-colors"
    >
      {item.icon}
      <span className="flex-1 text-left font-semibold">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rust px-1 text-xs font-bold text-sand">
          {item.badge}
        </span>
      )}
      {item.active !== undefined ? (
        <ToggleSwitch active={item.active} />
      ) : item.opensDialog ? (
        <ExternalLink size={18} className="text-bark/40 dark:text-sand/40" />
      ) : (
        <ChevronRight size={18} className="text-bark/40 dark:text-sand/40" />
      )}
    </button>
  );
}

/**
 * Full-page menu for mobile — opened from the BottomNav "Meny" button and
 * listing every destination and account action. Item definitions are shared
 * with the desktop header dropdown via useNavMenuItems().
 */
export function MenuPage() {
  const { destinations, account } = useNavMenuItems();

  return (
    <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0 pt-[env(safe-area-inset-top)]">
      <Header title={"meny"} />

      <div className="max-w-4xl mx-auto p-lg md:p-xl">
        <h2 className="text-lg font-bold text-bark dark:text-sand mb-3">
          Navigasjon
        </h2>
        <div className="space-y-3 mb-xxl">
          {destinations.map((item) => (
            <MenuRow key={item.label} item={item} />
          ))}
        </div>

        <h2 className="text-lg font-bold text-bark dark:text-sand mb-3">
          Konto
        </h2>
        <div className="space-y-3 mb-xxl">
          {account.map((item) => (
            <MenuRow key={item.label} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
