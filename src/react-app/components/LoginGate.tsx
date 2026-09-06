import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isGuestBypassAllowed } from "../lib/guestMode";
import { LoginScreen } from "./LoginScreen";

interface LoginGateProps {
  children: ReactNode;
}

export function LoginGate({ children }: LoginGateProps) {
  const { user, loading, bypassGuestLogin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand dark:bg-bark text-bark dark:text-sand">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
        <span className="sr-only">Laster</span>
      </div>
    );
  }

  if (user || location.pathname === "/reset-password") {
    return <>{children}</>;
  }

  return (
    <LoginScreen
      allowBypass={isGuestBypassAllowed()}
      onBypass={bypassGuestLogin}
    />
  );
}
