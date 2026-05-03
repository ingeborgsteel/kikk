import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { isSupabaseConfigured } from "../lib/supabase";
import { Input } from "./ui/input.tsx";
import { Modal } from "./ui/Modal.tsx";

export function LoginForm({
  closeLoginForm,
  showLoginForm,
}: {
  closeLoginForm: () => void;
  showLoginForm: boolean;
}) {
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showLoginForm) {
        e.preventDefault();
        e.stopPropagation();
        closeLoginForm();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeLoginForm, showLoginForm]);

  // Don't render if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await signInWithEmail(email, password);

    if (error) {
      // Map common errors to user-friendly Norwegian messages
      let errorMessage = "Noe gikk galt. Prøv igjen.";
      if (
        error.message.toLowerCase().includes("invalid login credentials") ||
        error.message.toLowerCase().includes("invalid email or password")
      ) {
        errorMessage = "Ugyldig e-post eller passord.";
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        errorMessage = "E-posten din er ikke bekreftet. Sjekk innboksen din.";
      } else if (error.message.toLowerCase().includes("rate limit")) {
        errorMessage = "For mange forsøk. Vent litt før du prøver igjen.";
      }
      setMessage(errorMessage);
    } else {
      setEmail("");
      setPassword("");
      closeLoginForm();
    }

    setLoading(false);
  };

  if (!showLoginForm) {
    return null;
  }

  return (
    <Modal onClose={closeLoginForm} isOpen={showLoginForm} title="Logg inn">
      <form onSubmit={handleSignIn} className="space-y-lg">
        <Input
          type="email"
          placeholder="din@epost.no"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          name="email"
          required
        />
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-bark/50 dark:text-sand/50"
          />
          <Input
            type="password"
            placeholder="Passord"
            className={"pl-8"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            name="password"
            required
          />
        </div>
        <div className="flex gap-md justify-end pt-md">
          <Button
            type="button"
            onClick={() => {
              closeLoginForm();
              setEmail("");
              setPassword("");
              setMessage("");
            }}
            variant="outline"
            size="sm"
          >
            Avbryt
          </Button>
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Logger inn..." : "Logg inn"}
          </Button>
        </div>
        {message && (
          <p className="text-xs mt-1 text-bark dark:text-sand">{message}</p>
        )}
      </form>
    </Modal>
  );
}
