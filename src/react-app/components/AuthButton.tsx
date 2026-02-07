import {LogIn, LogOut} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {Button} from './ui/button';
import {isSupabaseConfigured} from '../lib/supabase';

export function AuthButton({setShowLoginForm}: { setShowLoginForm: (show: boolean) => void }) {
  const {user, signOut} = useAuth();

  // Don't render if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setShowLoginForm(false);
  };

  if (user) {
    return (
      <Button
        onClick={handleSignOut}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <LogOut size={16}/>
        Logg ut
      </Button>
    );
  }

  return (
    <Button
      onClick={() => setShowLoginForm(true)}
      variant="secondary"
      className="flex items-center gap-2"
    >
      <LogIn size={16}/>
      Logg inn
    </Button>
  );
}
