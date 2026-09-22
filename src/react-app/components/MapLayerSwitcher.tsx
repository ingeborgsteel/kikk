import { ComponentType, ReactNode, useEffect, useRef, useState } from "react";
import { ArrowLeft, Info, Mountain, Satellite } from "lucide-react";
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

function AttributionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 hover:text-moss"
    >
      {children}
    </a>
  );
}

const LAYER_ATTRIBUTION: Record<MapLayer, ReactNode> = {
  standard: (
    <AttributionLink href="https://www.kartverket.no/">
      Kartverket
    </AttributionLink>
  ),
  topo: (
    <>
      <AttributionLink href="https://www.mapbox.com/about/maps/">
        Mapbox
      </AttributionLink>
      {", "}
      <AttributionLink href="https://www.openstreetmap.org/copyright">
        OpenStreetMap
      </AttributionLink>
      {" · "}
      <AttributionLink href="https://www.mapbox.com/map-feedback/">
        Forbedre dette kartet
      </AttributionLink>
    </>
  ),
  aerial: (
    <>
      <AttributionLink href="https://www.mapbox.com/about/maps/">
        Mapbox
      </AttributionLink>
      {", "}
      <AttributionLink href="https://www.maxar.com/">Maxar</AttributionLink>
      {" · "}
      <AttributionLink href="https://www.mapbox.com/map-feedback/">
        Forbedre dette kartet
      </AttributionLink>
    </>
  ),
};

export function MapLayerSwitcher() {
  const { currentLayer, setCurrentLayer } = useMapPreferences();
  const [expanded, setExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Collapse on any interaction outside the switcher, like BottomNav.
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false);
        setShowInfo(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  const ActiveIcon =
    LAYERS.find((layer) => layer.id === currentLayer)?.icon ?? Mountain;

  return (
    <div ref={ref} className="relative">
      {/* Collapsed: round button showing the active layer icon. Expanded:
          morphs downward into a panel listing every layer plus a Kartinfo
          row, which swaps the panel to attribution details. */}
      <div
        className={`overflow-hidden rounded-3xl ${glassSurface} transition-all duration-300 ease-in-out ${
          expanded ? (showInfo ? "w-44 h-36" : "w-44 h-[184px]") : "w-12 h-12"
        }`}
      >
        {expanded ? (
          showInfo ? (
            <div className="flex flex-col h-full text-bark dark:text-sand">
              <div className="flex items-center gap-1 px-2 pt-2">
                <button
                  onClick={() => setShowInfo(false)}
                  className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full hover:bg-white/60 dark:hover:bg-bark/60 transition-colors"
                  aria-label="Tilbake til kartvalg"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm font-semibold">Kartinfo</span>
              </div>
              <div className="flex-1 px-3 pb-3 pt-1 text-xs leading-relaxed space-y-1.5 overflow-y-auto">
                <p>Kartdata: © {LAYER_ATTRIBUTION[currentLayer]}</p>
                <p>
                  Laget med{" "}
                  <AttributionLink href="https://leafletjs.com">
                    Leaflet
                  </AttributionLink>
                </p>
              </div>
            </div>
          ) : (
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
              <div className="mx-3 border-t border-bark/10 dark:border-sand/20" />
              <button
                onClick={() => setShowInfo(true)}
                className="flex h-10 shrink-0 items-center gap-2 px-3 text-sm font-medium text-bark dark:text-sand hover:bg-white/60 dark:hover:bg-bark/60 transition-colors"
              >
                <Info size={16} className="shrink-0" />
                Kartinfo
              </button>
            </div>
          )
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
