import {Map, User} from 'lucide-react';

interface BottomNavProps {
  currentView: 'map' | 'observations';
  onViewChange: (view: 'map' | 'observations') => void;
}

export function BottomNav({currentView, onViewChange}: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-forest border-t-2 border-moss z-[1000] safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onViewChange('map')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            currentView === 'map'
              ? 'text-sunlit'
              : 'text-sand'
          }`}
          aria-label="Map"
        >
          <Map size={24} />
          <span className="text-xs font-medium">Kart</span>
        </button>
        <button
          onClick={() => onViewChange('observations')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            currentView === 'observations'
              ? 'text-sunlit'
              : 'text-sand'
          }`}
          aria-label="Profile"
        >
          <User size={24} />
          <span className="text-xs font-medium">Profil</span>
        </button>
      </div>
    </nav>
  );
}
