import { BarChart3, Binoculars, Map, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { Navigation } from "lucide-react";
import { useGeolocation } from "../context/GeolocationContext";
import { useMapPreferences } from "../context/MapPreferencesContext";

interface BottomNavProps {
  currentView: "map" | "observations" | "stats" | "profile";
  onLoginClick: () => void;
}

export function BottomNav({ currentView, onLoginClick }: BottomNavProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const supabaseConfigured = isSupabaseConfigured();

  const { followMode, setFollowMode } = useGeolocation();
  const { showUncertaintyOverlay, setShowUncertaintyOverlay } =
    useMapPreferences();

  const handleProfileOrLogin = () => {
    if (user) {
      navigate("/profile");
    } else {
      onLoginClick();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-rust z-[500] safe-area-bottom">
      {currentView === "map" && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(4rem)] md:bottom-md z-[500] mb-3 flex items-center gap-2">
          <button
            onClick={() => setFollowMode(!followMode)}
            className={`px-3 py-2 rounded-full shadow-custom-lg font-semibold text-sm transition-all flex items-center gap-2 border-2 ${
              followMode
                ? "bg-moss text-sand border-sand"
                : "bg-sand dark:bg-bark text-bark dark:text-sand border-moss hover:bg-moss dark:hover:bg-moss"
            }`}
            title="Følger posisjonen din"
            aria-label="Veksle følg meg"
          >
            <Navigation size={16} />
            <span>Følg meg</span>
          </button>
          <button
            onClick={() => setShowUncertaintyOverlay(!showUncertaintyOverlay)}
            className={`p-2 rounded-full shadow-custom-lg font-semibold text-sm transition-all flex items-center gap-2 border-2 ${
              showUncertaintyOverlay
                ? "bg-moss text-sand border-sand"
                : "bg-sand dark:bg-bark text-bark dark:text-sand border-moss hover:bg-moss dark:hover:bg-moss"
            }`}
            title="Vis usikkerhetsradius"
            aria-label="Veksle usikkerhetsradius"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="12" r="6" opacity="0.7" />
              <circle cx="12" cy="12" r="10" opacity="0.45" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            currentView === "map" ? "text-sunlit" : "text-sand"
          }`}
          aria-label="Map"
        >
          <Map size={24} />
          <span className="text-xs font-medium">Kart</span>
        </button>
        <button
          onClick={() => navigate("/observations")}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            currentView === "observations" ? "text-sunlit" : "text-sand"
          }`}
          aria-label="Observations"
        >
          <Binoculars size={24} />
          <span className="text-xs font-medium">Kikket på</span>
        </button>
        <button
          onClick={() => navigate("/stats")}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            currentView === "stats" ? "text-sunlit" : "text-sand"
          }`}
          aria-label="Statistics"
        >
          <BarChart3 size={24} />
          <span className="text-xs font-medium">Statistikk</span>
        </button>
        {supabaseConfigured && (
          <button
            onClick={handleProfileOrLogin}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              currentView === "profile" ? "text-sunlit" : "text-sand"
            }`}
            aria-label={user ? "Profil" : "Logg inn"}
          >
            <User size={24} />
            <span className="text-xs font-medium">
              {user ? "Profil" : "Logg inn"}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
