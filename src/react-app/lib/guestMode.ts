/**
 * Login gate environment helpers.
 *
 * Production builds require login by default. Local development (`vite`)
 * always allows the hidden guest bypass. For feature branch / preview
 * builds, set `VITE_FORCE_LOGIN=false` in the build environment.
 */
export function isLoginRequired(): boolean {
  const forceLogin = import.meta.env.VITE_FORCE_LOGIN;
  if (forceLogin === "true") return true;
  if (forceLogin === "false") return false;
  return import.meta.env.PROD;
}

export function isGuestBypassAllowed(): boolean {
  return !isLoginRequired();
}
