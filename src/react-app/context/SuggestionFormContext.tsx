import { createContext, ReactNode, useContext, useState } from "react";
import { GitHubIssueForm } from "../components/GitHubIssueForm";

type SuggestionFormContextType = () => void;

const SuggestionFormContext = createContext<
  SuggestionFormContextType | undefined
>(undefined);

/**
 * Owns the "Forslag til forbedring" (GitHub issue) modal so any menu item can
 * open it. Mounted once near the app root — the modal renders as a sibling of
 * `children`, like FeatureAlertsModal.
 */
export function SuggestionFormProvider({ children }: { children: ReactNode }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <SuggestionFormContext.Provider value={() => setShowForm(true)}>
      {children}
      <GitHubIssueForm showForm={showForm} onClose={() => setShowForm(false)} />
    </SuggestionFormContext.Provider>
  );
}

/**
 * Returns a function that opens the suggestion modal.
 */
export function useSuggestionForm(): SuggestionFormContextType {
  const context = useContext(SuggestionFormContext);
  if (context === undefined) {
    throw new Error(
      "useSuggestionForm must be used within a SuggestionFormProvider",
    );
  }
  return context;
}
