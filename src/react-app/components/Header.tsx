import { JSX } from "react";
import { AuthButton } from "./AuthButton";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  title: string;
  openProfilePage?: () => void;
  leftButton?: JSX.Element;
  navButtons?: JSX.Element;
}

const Header = ({
  title,
  openProfilePage,
  leftButton = <ThemeToggle />,
  navButtons,
}: HeaderProps) => {
  return (
    <header className="bg-forest text-sand p-md sticky top-0 z-[1000]">
      <div className="max-w-4xl mx-auto ml-16">
        <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">
          {title}
        </h1>
      </div>
      <div className="absolute left-lg top-1/2 -translate-y-1/2">
        {leftButton}
      </div>
      <div className="absolute right-lg top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
        {navButtons}
        <AuthButton openProfilePage={openProfilePage} />
      </div>
    </header>
  );
};

export default Header;
