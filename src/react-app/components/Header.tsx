import { AuthButton } from "./AuthButton";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  setShowLoginForm?: (show: boolean) => void;
}

const Header = ({ setShowLoginForm }: HeaderProps) => {
  return (
    <header className="bg-forest text-sand p-lg md:p-xl relative">
      <div className="max-w-4xl mx-auto ml-16">
        <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">
          kikket på
        </h1>
      </div>
      <div className="absolute left-lg top-1/2 -translate-y-1/2">
        <ThemeToggle />
      </div>
      <div className="absolute right-lg top-1/2 -translate-y-1/2 md:hidden flex items-center gap-2">
        {setShowLoginForm && <AuthButton setShowLoginForm={setShowLoginForm} />}
      </div>
    </header>
  );
};

export default Header;
