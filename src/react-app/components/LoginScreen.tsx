import { useEffect, useRef, useState } from "react";
import { LoginForm } from "./LoginForm";
import { GitHubSuggestionButton } from "./GitHubSuggestionButton";
import { GitHubIssueForm } from "./GitHubIssueForm";

interface LoginScreenProps {
  allowBypass: boolean;
  onBypass: () => void;
}

export function LoginScreen({ allowBypass, onBypass }: LoginScreenProps) {
  const [showIssueForm, setShowIssueForm] = useState(false);
  const clickCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleHiddenClick = () => {
    if (!allowBypass) return;

    clickCountRef.current += 1;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500);

    if (clickCountRef.current >= 3) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      clickCountRef.current = 0;
      onBypass();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-sand dark:bg-bark text-bark dark:text-sand">
      <div className="max-w-lg w-full space-y-6">
        <div
          onClick={handleHiddenClick}
          className="text-center select-none"
          aria-label="kikk"
        >
          <img
            src="/kikkert.png"
            alt="kikk"
            className="h-24 w-auto mx-auto mb-3"
          />
          <h1 className="text-5xl font-bold tracking-wider text-forest dark:text-sand">
            kikk
          </h1>
        </div>

        <p className="text-lg leading-relaxed text-center text-bark dark:text-sand">
          Hei! Dette er <span className="font-semibold">kikk</span> – en liten
          app jeg lager for pappa, som er ornitolog og har ønsket seg et system
          for å føre observasjoner i felt. Nå er den endelig klar for flere
          øyne.
        </p>

        <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 shadow-custom-lg p-6">
          <LoginForm inline />
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-[500] hidden sm:flex items-end text-forest dark:text-sunlit">
        <div className="relative flex flex-col items-end -rotate-6 -mr-2 mb-6">
          <span className="text-xs font-medium whitespace-nowrap">
            Forslag eller feil?
          </span>
          <svg
            viewBox="0 0 40 60"
            className="w-8 h-11 text-current"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="login-curved-arrow"
                viewBox="0 0 10 10"
                refX="1"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
                overflow="visible"
              >
                <path
                  d="M1 1 L9 5 L1 9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>
            </defs>
            <path
              d="M6 3 C 22 8, 32 20, 34 40"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
              markerEnd="url(#login-curved-arrow)"
            />
          </svg>
        </div>
        <GitHubSuggestionButton
          onClick={() => setShowIssueForm(true)}
          floating={false}
          showTooltip={false}
        />
      </div>

      <GitHubIssueForm
        showForm={showIssueForm}
        onClose={() => setShowIssueForm(false)}
      />
    </div>
  );
}
