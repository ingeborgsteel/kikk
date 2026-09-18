import { ComponentType, useEffect, useRef, useState } from "react";
import { Mountain, Satellite } from "lucide-react";
import { glassSurface } from "../lib/glass";
import {
  useMapPreferences,
  type MapLayer,
} from "../context/MapPreferencesContext";
import { NorwayIcon } from "./icons/NorwayIcon";

type LayerIcon = ComponentType<{ size?: number | string; className?: string }>;

const LAYERS: { id: MapLayer; label: string; icon: LayerIcon }[] = [
  { id: "standard", label: "Norgeskart", icon: NorwayIcon },
  { id: "topo", label: "Kart", icon: Mountain },
  { id: "aerial", label: "Flyfoto", icon: Satellite },
];

export function MapLayerSwitcher() {
  const { currentLayer, setCurrentLayer } = useMapPreferences();
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Collapse on any interaction outside the switcher, like BottomNav.
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  const ActiveIcon =
    LAYERS.find((layer) => layer.id === currentLayer)?.icon ?? Mountain;

  return (
    <div ref={ref} className="absolute top-md right-md z-[500]">
      {/* Collapsed: round button showing the active layer icon. Expanded:
          morphs downward into a panel listing every layer (h-12 rows). */}
      <div
        className={`overflow-hidden rounded-3xl ${glassSurface} transition-all duration-300 ease-in-out ${
          expanded ? "w-36 h-36" : "w-12 h-12"
        }`}
      >
        {expanded ? (
          <div className="flex flex-col h-full">
            {LAYERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setCurrentLayer(id);
                  setExpanded(false);
                }}
                className={`flex flex-1 items-center gap-2 px-3 text-sm font-medium transition-colors ${
                  id === currentLayer
                    ? "bg-moss text-sand"
                    : "text-bark dark:text-sand hover:bg-white/60 dark:hover:bg-bark/60"
                }`}
                aria-pressed={id === currentLayer}
              >
                <Icon size={18} className="shrink-0" />
                {label}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="h-full w-full flex items-center justify-center text-bark dark:text-sand"
            aria-label="Bytt karttype"
            aria-expanded={false}
            title="Karttype"
          >
            <ActiveIcon size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
