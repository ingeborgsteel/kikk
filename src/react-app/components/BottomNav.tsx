import {Binoculars, Map, User} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {isSupabaseConfigured} from '../lib/supabase';

interface BottomNavProps {
  currentView: 'map' | 'observations' | 'profile';
  onViewChange: (view: 'map' | 'observations' | 'profile') => void;
  onLoginClick: () => void;
}

export function BottomNav({currentView, onViewChange, onLoginClick}: BottomNavProps) {
  const {user} = useAuth();
  const supabaseConfigured = isSupabaseConfigured();

  const handleProfileOrLogin = () => {
    if (user) {
      onViewChange('profile');
    } else {
      onLoginClick();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-rust z-[1000] safe-area-bottom">
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
          <Map size={24}/>
          <span className="text-xs font-medium">Kart</span>
        </button>
        <button
          onClick={() => onViewChange('observations')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            currentView === 'observations'
              ? 'text-sunlit'
              : 'text-sand'
          }`}
          aria-label="Observations"
        >
          <Binoculars size={24}/>
          <span className="text-xs font-medium">Kikket på</span>
        </button>
        {supabaseConfigured && (
          <button
            onClick={handleProfileOrLogin}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              currentView === 'profile'
                ? 'text-sunlit'
                : 'text-sand'
            }`}
            aria-label={user ? 'Profil' : 'Logg inn'}
          >
            <User size={24}/>
            <span className="text-xs font-medium">{user ? 'Profil' : 'Logg inn'}</span>
          </button>
        )}
      </div>
    </nav>
  );
}
