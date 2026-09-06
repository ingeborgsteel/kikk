import { LogOut, User, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export function AuthButton({
  openProfilePage,
}: {
  openProfilePage?: () => void;
}) {
  const { user, signOut, isImpersonating, stopImpersonating } = useAuth();

  if (!user) {
    return null;
  }

  if (isImpersonating) {
    return (
      <Button
        onClick={stopImpersonating}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <EyeOff size={16} />
        Slutt å se som {user.name || user.email}
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
      onClick={signOut}
      variant="secondary"
      className="flex items-center gap-2"
    >
      <LogOut size={16} />
      Logg ut
    </Button>
  );
}
