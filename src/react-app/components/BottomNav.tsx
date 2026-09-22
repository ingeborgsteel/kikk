import { useEffect, useRef, useState } from "react";
import { glassSurface } from "../lib/glass";
import {
  BarChart3,
  Binoculars,
  EyeOff,
  Map,
  MapPin,
  Menu,
  Newspaper,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type View =
  | "map"
  | "observations"
  | "stats"
  | "news"
  | "locations"
  | "admin"
  | "menu";

interface BottomNavProps {
  currentView: View;
}

const viewIcons: Record<View, React.ReactNode> = {
  map: <Map size={20} />,
  observations: <Binoculars size={20} />,
  stats: <BarChart3 size={20} />,
  news: <Newspaper size={20} />,
  locations: <MapPin size={20} />,
  admin: <Shield size={20} />,
  menu: <Menu size={20} />,
};

/** Pages that have no permanent slot in the nav — they appear as a temporary
 *  middle item while you are on them. */
const temporaryItems: Partial<
  Record<View, { icon: React.ReactNode; label: string; to: string }>
> = {
  stats: { icon: <BarChart3 size={20} />, label: "Statistikk", to: "/stats" },
  news: { icon: <Newspaper size={20} />, label: "Nyheter", to: "/news" },
  locations: {
    icon: <MapPin size={20} />,
    label: "Mine lokaliteter",
    to: "/locations",
  },
  admin: { icon: <Shield size={20} />, label: "Admin", to: "/admin" },
};

function NavButton({
  icon,
  label,
  active,
  onClick,
  ariaLabel,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 h-full rounded-full transition-colors whitespace-nowrap ${
        active ? "text-rust" : "text-bark dark:text-sand"
      }`}
      aria-label={ariaLabel}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export function BottomNav({ currentView }: BottomNavProps) {
  const navigate = useNavigate();
  const { isImpersonating, stopImpersonating } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const currentTemp = temporaryItems[currentView];
  // The temporary item stays in the nav after leaving its page, until the
  // pill is collapsed — then the slot resets to whatever page you are on.
  const [stickyTemp, setStickyTemp] = useState<{
    icon: React.ReactNode;
    label: string;
    to: string;
  } | null>(null);
  const [prevTemp, setPrevTemp] = useState(currentTemp);
  const [prevExpanded, setPrevExpanded] = useState(expanded);

  if (prevTemp !== currentTemp) {
    setPrevTemp(currentTemp);
    if (currentTemp) setStickyTemp(currentTemp);
  }
  if (prevExpanded !== expanded) {
    setPrevExpanded(expanded);
    if (!expanded) setStickyTemp(null);
  }

  const temporaryItem = currentTemp ?? stickyTemp;
  const navRef = useRef<HTMLElement>(null);

  // Collapse on any interaction outside the nav. Taps on nav items keep it
  // open so the active destination stays highlighted.
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  return (
    <nav
      ref={navRef}
      className="md:hidden fixed bottom-6 right-4 left-4 z-[900] flex justify-end pb-[env(safe-area-inset-bottom)] pointer-events-none"
    >
      {/* Single glass pill: collapsed it is a round button showing the current
          page icon (right edge anchored); expanded it morphs leftward into a
          full-width bar. Fixed height so the morph never moves vertically.
          Sits below the map's action-button column so the two never overlap. */}
      <div
        className={`h-12 overflow-hidden rounded-full ${glassSurface} transition-[width] duration-300 ease-in-out pointer-events-auto ${
          expanded ? "w-full" : "w-12"
        }`}
      >
        {expanded ? (
          <div className="flex h-full items-center gap-1 px-2">
            <NavButton
              icon={<Map size={20} />}
              label="Kart"
              active={currentView === "map"}
              onClick={() => navigate("/")}
              ariaLabel="Map"
            />
            <NavButton
              icon={<Binoculars size={20} />}
              label="Kikket på"
              active={currentView === "observations"}
              onClick={() => navigate("/observations")}
              ariaLabel="Observations"
            />
            {temporaryItem && (
              <NavButton
                icon={temporaryItem.icon}
                label={temporaryItem.label}
                active={temporaryItem === currentTemp}
                onClick={() => navigate(temporaryItem.to)}
                ariaLabel={temporaryItem.label}
              />
            )}
            {isImpersonating ? (
              <NavButton
                icon={<EyeOff size={20} />}
                label="Slutt"
                onClick={stopImpersonating}
                ariaLabel="Slutt å se som bruker"
              />
            ) : (
              <NavButton
                icon={<Menu size={20} />}
                label="Meny"
                active={currentView === "menu"}
                onClick={() => navigate("/menu")}
                ariaLabel="Meny"
              />
            )}
          </div>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="h-full w-full flex items-center justify-center text-bark dark:text-sand"
            aria-label="Vis meny"
            aria-expanded={false}
          >
            {viewIcons[currentView]}
          </button>
        )}
      </div>
    </nav>
  );
}
