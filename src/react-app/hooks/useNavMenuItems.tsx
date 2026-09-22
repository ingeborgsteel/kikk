import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Binoculars,
  EyeOff,
  LogOut,
  Map as MapIcon,
  MessageSquare,
  Moon,
  Newspaper,
  Shield,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useObservations } from "../context/ObservationsContext";
import { useFeatureAlerts } from "../context/FeatureAlertsContext";
import { useSuggestionForm } from "../context/SuggestionFormContext";
import { useTheme } from "../context/ThemeContext";

export interface NavMenuItemDef {
  label: string;
  icon: ReactNode;
  badge?: number;
  /** True when the item opens a dialog/modal rather than navigating. */
  opensDialog?: boolean;
  /** When set, the item is an on/off toggle and renders a switch showing
   *  this state instead of a chevron/link affordance. */
  active?: boolean;
  action: () => void;
}

/**
 * Shared definition of all app navigation items — used by the desktop header
 * dropdown (NavMenu) and the mobile /menu page so both stay in sync.
 *
 * - `destinations`: main app pages (Kart, Kikket på, Statistikk, Nyheter,
 *   Admin for admins).
 * - `settings`: on/off preferences (Mørk modus).
 * - `account`: Profil + Logg ut, or "Slutt å se som X" while impersonating.
 * - `feedback`: actions that open a dialog rather than a page (Forslag).
 */
export function useNavMenuItems(): {
  destinations: NavMenuItemDef[];
  settings: NavMenuItemDef[];
  account: NavMenuItemDef[];
  feedback: NavMenuItemDef[];
} {
  const navigate = useNavigate();
  const { user, isAdmin, isImpersonating, signOut, stopImpersonating } =
    useAuth();
  const { observations } = useObservations();
  const { undismissedAlerts } = useFeatureAlerts();
  const openSuggestionForm = useSuggestionForm();
  const { theme, toggleTheme } = useTheme();

  const destinations: NavMenuItemDef[] = [
    {
      icon: <MapIcon size={18} />,
      label: "Kart",
      action: () => navigate("/"),
    },
    {
      icon: <Binoculars size={18} />,
      label: "Kikket på",
      badge: observations.length || undefined,
      action: () => navigate("/observations"),
    },
    {
      icon: <BarChart3 size={18} />,
      label: "Statistikk",
      action: () => navigate("/stats"),
    },
    {
      icon: <Newspaper size={18} />,
      label: "Nyheter",
      badge: undismissedAlerts.length || undefined,
      action: () => navigate("/news"),
    },
  ];
  if (isAdmin && !isImpersonating) {
    destinations.push({
      icon: <Shield size={18} />,
      label: "Admin",
      action: () => navigate("/admin"),
    });
  }

  const account: NavMenuItemDef[] = isImpersonating
    ? [
        {
          icon: <EyeOff size={18} />,
          label: `Slutt å se som ${user?.name || user?.email}`,
          action: () => stopImpersonating(),
        },
      ]
    : [
        {
          icon: <User size={18} />,
          label: "Profil",
          action: () => navigate("/profile"),
        },
        {
          icon: <LogOut size={18} />,
          label: "Logg ut",
          action: () => signOut(),
        },
      ];

  const settings: NavMenuItemDef[] = [
    {
      icon: <Moon size={18} />,
      label: "Mørk modus",
      active: theme === "dark",
      action: toggleTheme,
    },
  ];

  const feedback: NavMenuItemDef[] = [
    {
      icon: <MessageSquare size={18} />,
      label: "Forslag…",
      opensDialog: true,
      action: openSuggestionForm,
    },
  ];

  return { destinations, settings, account, feedback };
}
