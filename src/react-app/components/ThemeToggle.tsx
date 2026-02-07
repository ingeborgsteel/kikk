import {Moon, Sun} from 'lucide-react';
import {useTheme} from '../context/ThemeContext';
import {Button} from "./ui/button.tsx";

export function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();

  return (
    <Button
      size={"icon"}
      onClick={toggleTheme}
      className="p-sm bg-sand border-2 border-sand hover:bg-sand-dark text-bark transition-all shadow-none"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
    </Button>
  );
}
