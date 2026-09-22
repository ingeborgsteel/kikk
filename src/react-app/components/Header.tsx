import { JSX } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Binoculars, Map as MapIcon } from "lucide-react";
import { NavMenu } from "./NavMenu";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { useObservations } from "../context/ObservationsContext";

interface HeaderProps {
  title: string;
  leftButton?: JSX.Element;
}

function QuickLink({
  to,
  icon,
  label,
  badge,
}: {
  to: string;
  icon: JSX.Element;
  label: string;
  badge?: number;
}) {
  const navigate = useNavigate();
  const active = useLocation().pathname === to;
  return (
    <Button
      onClick={() => navigate(to)}
      variant={active ? "default" : "secondary"}
      size="icon"
      className="relative h-10 w-10"
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-sand px-1 text-xs font-bold text-bark">
          {badge}
        </span>
      )}
    </Button>
  );
}

const Header = ({ title, leftButton = <ThemeToggle /> }: HeaderProps) => {
  const navigate = useNavigate();
  const { observations } = useObservations();

  return (
    <header className="bg-forest text-sand p-md sticky top-0 z-[1000] hidden md:block">
      <div className="max-w-4xl mx-auto ml-16">
        <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">
          <button
            onClick={() => navigate("/")}
            className="cursor-pointer hover:text-sunlit transition-colors"
            title="Til forsiden"
          >
            {title}
          </button>
        </h1>
      </div>
      <div className="absolute left-lg top-1/2 -translate-y-1/2">
        {leftButton}
      </div>
      <div className="absolute right-lg top-1/2 -translate-y-1/2 flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2">
          <QuickLink to="/" icon={<MapIcon size={18} />} label="Kart" />
          <QuickLink
            to="/observations"
            icon={<Binoculars size={18} />}
            label="Kikket på"
            badge={observations.length}
          />
        </div>
        <NavMenu />
      </div>
    </header>
  );
};

export default Header;
