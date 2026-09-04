const baseURL =
  (import.meta.env.VITE_BETTER_AUTH_BASE_URL as string | undefined) ||
  window.location.origin;

export async function requestPasswordReset(
  email: string,
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`${baseURL}/api/auth/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirectTo: "/reset-password" }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(data.message || "Kunne ikke sende tilbakestillingslenke");
    }
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getResetLink(
  email: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const res = await fetch(`${baseURL}/api/admin/reset-password-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      message?: string;
    };
    if (!res.ok) {
      throw new Error(
        data.message || "Kunne ikke generere tilbakestillingslenke",
      );
    }
    if (!data.url) throw new Error("Manglende tilbakestillingslenke");
    return { url: data.url, error: null };
  } catch (e) {
    return { url: null, error: (e as Error).message };
  }
}

export async function resetPassword(
  newPassword: string,
  token: string,
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`${baseURL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword, token }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(data.message || "Kunne ikke tilbakestille passord");
    }
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
