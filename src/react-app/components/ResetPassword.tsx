import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input.tsx";
import { Modal } from "./ui/Modal.tsx";
import { resetPassword } from "../api/auth";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(() => {
    if (error) return "Lenken er ugyldig eller utløpt.";
    if (!token) return "Mangler tilbakestillingstoken.";
    return "";
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      setMessage("Passordet må være minst 8 tegn.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passordene stemmer ikke overens.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error: resetError } = await resetPassword(password, token);
    if (resetError) {
      setMessage(resetError);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen p-4 flex items-center justify-center bg-sand dark:bg-bark">
      <Modal
        isOpen={true}
        onClose={() => navigate("/")}
        title="Velg nytt passord"
      >
        {success ? (
          <div className="space-y-md">
            <p className="text-bark dark:text-sand">
              Passordet ditt er oppdatert.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Gå til kartet
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-md">
            <Input
              type="password"
              placeholder="Nytt passord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              name="password"
              required
            />
            <Input
              type="password"
              placeholder="Gjenta nytt passord"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              name="confirmPassword"
              required
            />
            <Button
              type="submit"
              disabled={loading || !token || !!error}
              className="w-full"
            >
              {loading ? "Lagrer..." : "Lagre nytt passord"}
            </Button>
            {message && (
              <p className="text-xs text-bark dark:text-sand">{message}</p>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
