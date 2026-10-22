import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input.tsx";
import { Modal } from "./ui/Modal.tsx";

// Turnstile sitekey from environment variable (configured in wrangler.json)
const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY;

interface LoginFormProps {
  closeLoginForm?: () => void;
  inline?: boolean;
}

export function LoginForm({ closeLoginForm, inline = false }: LoginFormProps) {
  const { signInWithEmail, signUp, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inline) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeLoginForm?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeLoginForm, inline]);

  // Load Turnstile script
  useEffect(() => {
    if (mode !== "signup") return;

    // Check if script is already loaded
    if (window.turnstile) return;

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [mode]);

  // Render Turnstile widget when in signup mode
  useEffect(() => {
    if (mode !== "signup" || !turnstileRef.current) return;

    // Clear previous widget if any
    turnstileRef.current.innerHTML = "";

    const renderWidget = () => {
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          "error-callback": () => {
            setTurnstileToken(null);
          },
        });
      }
    };

    // Try immediately
    renderWidget();

    // If script not loaded yet, retry with a delay
    if (!window.turnstile) {
      const timeout = setTimeout(renderWidget, 500);
      return () => clearTimeout(timeout);
    }
  }, [mode]);

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
      const result = await signUp(
        email,
        password,
        name,
        turnstileToken || undefined,
      );
      error = result.error;
    } else if (mode === "signin") {
      const result = await signInWithEmail(email, password);
      error = result.error;
    } else if (mode === "forgot") {
      const result = await sendPasswordReset(email);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      if (mode === "signup" || mode === "signin") {
        closeLoginForm?.();
      } else if (mode === "forgot") {
        setMessage("E-post sendt hvis adressen er registrert");
      }
      resetForm();
    }
  };

  const toggleMode = () => {
    resetForm();
    setMode((prev) =>
      prev === "signin" ? "signup" : prev === "signup" ? "signin" : "signin",
    );
  };

  const handleForgotPassword = () => {
    resetForm();
    setMode("forgot");
  };

  const content = (
    <div className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="block text-sm font-medium mb-1">Navn</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ditt navn"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">E-post</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@epost.no"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Passord</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      {mode === "signup" && <div ref={turnstileRef} className="mt-4" />}
      {message && (
        <div className="text-sm text-red-600 dark:text-red-400">{message}</div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "Laster..."
          : mode === "signup"
            ? "Registrer deg"
            : mode === "signin"
              ? "Logg inn"
              : "Send lenke"}
      </Button>
      <div className="text-sm text-center">
        {mode === "signin" ? (
          <>
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Registrer deg
            </button>
            {" | "}
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Glemt passord?
            </button>
          </>
        ) : mode === "signup" ? (
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Har du allerede konto? Logg inn
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Tilbake til innlogging
          </button>
        )}
      </div>
    </div>
  );

  return inline ? (
    <form onSubmit={handleSubmit}>{content}</form>
  ) : (
    <Modal
      title={
        mode === "signup"
          ? "Registrer deg"
          : mode === "signin"
            ? "Logg inn"
            : "Glemt passord"
      }
      onClose={closeLoginForm || (() => {})}
      isOpen={true}
    >
      <form onSubmit={handleSubmit}>{content}</form>
    </Modal>
  );
}
