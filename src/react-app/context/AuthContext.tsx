import { createContext, useContext, useState, ReactNode } from "react";
import type { User } from "better-auth";
import { betterAuthClient } from "../lib/auth";
import { useUserAccesses as useUserAccess } from "../queries/useUserAccesses";
import { UserAccess } from "../types/user_access";
import { requestPasswordReset } from "../api/auth";
import { isLoginRequired } from "../lib/guestMode";

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
  isGuest: boolean;
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
  bypassGuestLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_USER_ID_KEY = "kikk-guest-user-id";

function makeGuestUser(id: string): AppUser {
  return {
    id,
    email: "gjest@kikk",
    name: "Gjest",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: null,
  } as AppUser;
}

function loadSavedGuestId(): string | null {
  if (typeof window === "undefined" || isLoginRequired()) return null;
  try {
    return localStorage.getItem(GUEST_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const savedGuestId = loadSavedGuestId();
  const [isGuest, setIsGuest] = useState(!!savedGuestId);
  const [guestUser, setGuestUser] = useState<AppUser | null>(
    savedGuestId ? makeGuestUser(savedGuestId) : null,
  );

  const { data, isPending } = betterAuthClient.useSession();
  const session = (data?.session as AppSession | undefined) ?? undefined;
  const authUser = ((data?.user as AppUser | undefined) ??
    null) as AppUser | null;
  const user = authUser ?? (isGuest ? guestUser : null);
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
    return { error: error ? new Error(error.message ?? String(error)) : null };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await requestPasswordReset(email);
    return { error: error ? new Error(error) : null };
  };

  const signOut = async () => {
    if (isGuest) {
      setIsGuest(false);
      setGuestUser(null);
      try {
        localStorage.removeItem(GUEST_USER_ID_KEY);
      } catch {
        // ignore
      }
      return;
    }

    await betterAuthClient.signOut();
    setIsGuest(false);
    setGuestUser(null);
    try {
      localStorage.removeItem(GUEST_USER_ID_KEY);
    } catch {
      // ignore
    }
  };

  const stopImpersonating = async () => {
    await betterAuthClient.admin.stopImpersonating();
    window.location.reload();
  };

  const bypassGuestLogin = () => {
    if (isLoginRequired()) return;
    let id: string;
    try {
      id = localStorage.getItem(GUEST_USER_ID_KEY) || crypto.randomUUID();
      localStorage.setItem(GUEST_USER_ID_KEY, id);
    } catch {
      id = crypto.randomUUID();
    }
    setIsGuest(true);
    setGuestUser(makeGuestUser(id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        isImpersonating,
        isGuest,
        signInWithEmail,
        signUp,
        sendPasswordReset,
        signOut,
        stopImpersonating,
        userAccess,
        showLoginForm,
        setShowLoginForm,
        bypassGuestLogin,
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
