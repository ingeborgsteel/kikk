import {Binoculars, MapPin} from 'lucide-react';
import {Button} from "./ui/button.tsx";

interface KikkemodusToggleProps {
  kikkemodusActive: boolean;
  onToggle: () => void;
}

export function KikkemodusToggle({kikkemodusActive, onToggle}: KikkemodusToggleProps) {
  return (
    <Button
      size={"icon"}
      onClick={onToggle}
      className={`p-sm border-2 transition-all shadow-none ${
        kikkemodusActive
          ? 'bg-sunlit border-sunlit hover:bg-sunlit-dark text-bark'
          : 'bg-sand border-sand hover:bg-sand-dark text-bark'
      }`}
      aria-label={kikkemodusActive ? 'Kikkemodus aktiv' : 'Kikkemodus inaktiv'}
      title={kikkemodusActive ? 'Kikkemodus: Kun observasjoner' : 'Normal modus: Observasjoner og lokaliteter'}
    >
      {kikkemodusActive ? <Binoculars size={20}/> : <MapPin size={20}/>}
    </Button>
  );
}
