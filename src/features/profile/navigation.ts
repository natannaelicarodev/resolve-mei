export const PROFILE_SUCCESS_DELAY_MS = 1200;

export function scheduleProfileRedirect(callback: () => void): () => void {
  const timer = setTimeout(callback, PROFILE_SUCCESS_DELAY_MS);
  return () => clearTimeout(timer);
}
