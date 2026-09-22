import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const MIN_DISPLAY_MS = 1000;
const FADE_MS = 500;

// Read the stored theme directly so the splash matches before ThemeProvider's
// effect applies the `dark` class on the document root.
function readInitialDark(): boolean {
  try {
    const stored = localStorage.getItem("kikk_theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
  } catch {
    // localStorage unavailable — fall through to system preference
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Splash screen shown while the app boots — logo and app name for at least
 * MIN_DISPLAY_MS (and until the auth session check resolves), then fades out.
 * Rendered as a fixed overlay on top of everything.
 */
export function SplashScreen() {
  const { loading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [dark] = useState(readInitialDark);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const done = minElapsed && !loading;

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setMounted(false), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [done]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[2000] flex flex-col items-center justify-center transition-opacity duration-500 ${
        dark ? "bg-bark" : "bg-sand"
      } ${done ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      aria-hidden={done}
    >
      <img src="/kikkert.png" alt="" className="h-28 w-auto mb-4" />
      <span
        className={`text-5xl font-bold tracking-wider ${
          dark ? "text-sand" : "text-forest"
        }`}
      >
        kikk
      </span>
    </div>
  );
}
