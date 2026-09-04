import { BarChart3, Binoculars, EyeOff, Map, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface BottomNavProps {
  currentView: "map" | "observations" | "stats" | "profile" | "admin";
  onLoginClick: () => void;
}

export function BottomNav({ currentView, onLoginClick }: BottomNavProps) {
  const navigate = useNavigate();
  const { user, isAdmin, isImpersonating, stopImpersonating } = useAuth();

  const handleProfileOrLogin = () => {
    if (user) {
      navigate("/profile");
    } else {
      onLoginClick();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-rust z-[500] safe-area-bottom">
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
        {isAdmin && !isImpersonating && (
          <button
            onClick={() => navigate("/admin")}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              currentView === "admin" ? "text-sunlit" : "text-sand"
            }`}
            aria-label="Admin"
          >
            <Shield size={24} />
            <span className="text-xs font-medium">Admin</span>
          </button>
        )}
        {isImpersonating ? (
          <button
            onClick={stopImpersonating}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors text-sunlit"
            aria-label="Slutt å se som bruker"
          >
            <EyeOff size={24} />
            <span className="text-xs font-medium">Slutt</span>
          </button>
        ) : (
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
