import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input.tsx";
import { Modal } from "./ui/Modal.tsx";

export function LoginForm({ closeLoginForm }: { closeLoginForm: () => void }) {
  const { signInWithEmail, signUp, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeLoginForm();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeLoginForm]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    let error: Error | null = null;

    if (mode === "signup") {
      const result = await signUp(email, password, name);
      if (result.error) {
        error = result.error;
      } else {
        // Auto-sign in after successful sign-up
        const signInResult = await signInWithEmail(email, password);
        error = signInResult.error;
      }
    } else if (mode === "forgot") {
      const result = await sendPasswordReset(email);
      if (result.error) {
        error = result.error;
      } else {
        setMessage("Sjekk e-posten din for en tilbakestillingslenke.");
        setLoading(false);
        return;
      }
    } else {
      const result = await signInWithEmail(email, password);
      error = result.error;
    }

    if (error) {
      const lower = error.message.toLowerCase();
      let errorMessage = "Noe gikk galt. Prøv igjen.";
      if (
        lower.includes("invalid login credentials") ||
        lower.includes("invalid email or password")
      ) {
        errorMessage = "Ugyldig e-post eller passord.";
      } else if (lower.includes("email not confirmed")) {
        errorMessage = "E-posten din er ikke bekreftet. Sjekk innboksen din.";
      } else if (lower.includes("user already exists")) {
        errorMessage = "En bruker med denne e-posten finnes allerede.";
      } else if (lower.includes("rate limit")) {
        errorMessage = "For mange forsøk. Vent litt før du prøver igjen.";
      }
      setMessage(errorMessage);
    } else {
      resetForm();
      closeLoginForm();
    }

    setLoading(false);
  };

  const getTitle = () => {
    switch (mode) {
      case "signup":
        return "Registrer deg";
      case "forgot":
        return "Glemt passord";
      default:
        return "Logg inn";
    }
  };

  const getSubmitLabel = () => {
    if (loading) return "Sender...";
    switch (mode) {
      case "signup":
        return "Registrer deg";
      case "forgot":
        return "Send tilbakestillingslenke";
      default:
        return "Logg inn";
    }
  };

  return (
    <Modal onClose={closeLoginForm} isOpen={true} title={getTitle()}>
      <form onSubmit={handleSubmit} className="space-y-lg">
        {mode === "signup" && (
          <Input
            type="text"
            placeholder="Navn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            name="name"
            required
          />
        )}
        <Input
          type="email"
          placeholder="din@epost.no"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          name="email"
          required
        />
        {mode !== "forgot" && (
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
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              name="password"
              required
            />
          </div>
        )}
        <div className="flex flex-col gap-md pt-md">
          {mode === "signin" && (
            <>
              <p className="text-sm text-bark dark:text-sand">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setMessage("");
                  }}
                  className="underline hover:text-forest dark:hover:text-sand"
                >
                  Glemt passord?
                </button>
              </p>
              <p className="text-sm text-bark dark:text-sand">
                Har du ikke konto?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setMessage("");
                  }}
                  className="underline hover:text-forest dark:hover:text-sand"
                >
                  Registrer deg
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-sm text-bark dark:text-sand">
              Har du allerede en konto?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setMessage("");
                }}
                className="underline hover:text-forest dark:hover:text-sand"
              >
                Logg inn
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p className="text-sm text-bark dark:text-sand">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setMessage("");
                }}
                className="underline hover:text-forest dark:hover:text-sand"
              >
                Tilbake til innlogging
              </button>
            </p>
          )}
          <div className="flex gap-md justify-end">
            <Button
              type="button"
              onClick={() => {
                closeLoginForm();
                resetForm();
              }}
              variant="outline"
              size="sm"
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading} size="sm">
              {getSubmitLabel()}
            </Button>
          </div>
        </div>
        {message && (
          <p className="text-xs mt-1 text-bark dark:text-sand break-all">
            {message}
          </p>
        )}
      </form>
    </Modal>
  );
}
