import { createContext, useContext, useState, ReactNode } from "react";
import type { User } from "better-auth";
import { betterAuthClient } from "../lib/auth";
import { useUserAccesses as useUserAccess } from "../queries/useUserAccesses";
import { UserAccess } from "../types/user_access";
import { requestPasswordReset } from "../api/auth";

interface AppUser extends User {
  role?: string | null;
}

interface AppSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  impersonatedBy?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  session: AppSession | undefined;
  loading: boolean;
  isAdmin: boolean;
  isImpersonating: boolean;
  userAccess: UserAccess | undefined;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: Error | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  stopImpersonating: () => Promise<void>;
  showLoginForm: boolean;
  setShowLoginForm: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { data, isPending } = betterAuthClient.useSession();
  const session = (data?.session as AppSession | undefined) ?? undefined;
  const user = ((data?.user as AppUser | undefined) ?? null) as AppUser | null;
  const loading = isPending;
  const isAdmin = user?.role === "admin";
  const isImpersonating = !!session?.impersonatedBy;

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

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await betterAuthClient.signUp.email({
      email,
      password,
      name,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await requestPasswordReset(email);
    return { error: error ? new Error(error) : null };
  };

  const signOut = async () => {
    await betterAuthClient.signOut();
  };

  const stopImpersonating = async () => {
    await betterAuthClient.admin.stopImpersonating();
    window.location.href = "/admin";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        isImpersonating,
        signInWithEmail,
        signUp,
        sendPasswordReset,
        signOut,
        stopImpersonating,
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
