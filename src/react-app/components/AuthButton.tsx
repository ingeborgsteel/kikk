import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { isSupabaseConfigured } from "../lib/supabase";

export function AuthButton({
  setShowLoginForm,
  openProfilePage,
}: {
  setShowLoginForm: (show: boolean) => void;
  openProfilePage?: () => void;
}) {
  const { user, signOut } = useAuth();

  // Don't render if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setShowLoginForm(false);
  };

  if (!user) {
    return (
      <Button
        onClick={() => setShowLoginForm(true)}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <LogIn size={16} />
        Logg inn
      </Button>
    );
  }

  if (openProfilePage) {
    return (
      <Button
        onClick={openProfilePage}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <User size={16} />
        Profil
      </Button>
    );
  }

  return (
    <Button
      onClick={handleSignOut}
      variant="secondary"
      className="flex items-center gap-2"
    >
      <LogOut size={16} />
      Logg ut
    </Button>
  );
}
