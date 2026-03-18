export const TOKEN_KEY = "shmp_token";

function notify() {
  try {
    window.dispatchEvent(new Event("auth_token_changed"));
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  notify();
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  notify();
}
