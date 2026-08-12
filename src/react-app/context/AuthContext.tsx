import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import type { User } from "better-auth";
import { betterAuthClient, isAuthConfigured } from "../lib/auth";
import { useUserAccesses as useUserAccess } from "../queries/useUserAccesses";
import { UserAccess } from "../types/user_access";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userAccess: UserAccess | undefined;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  showLoginForm: boolean;
  setShowLoginForm: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { data, isPending } = betterAuthClient.useSession();
  const user = data?.user ?? null;
  const loading = isAuthConfigured() ? isPending : false;

  const { data: userAccess } = useUserAccess(user?.id || "", {
    enabled: !!user?.id,
  });

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await betterAuthClient.signIn.email({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await betterAuthClient.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signOut,
        userAccess,
        showLoginForm,
        setShowLoginForm,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
