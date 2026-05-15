const TOKEN_KEY = "access_token";

function setCookie(value: string) {
  document.cookie = `${TOKEN_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function clearCookie() {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

export const authStore = {
  getToken: () =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,

  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setCookie(token);
  },

  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    clearCookie();
  },

  isAuthenticated: () => Boolean(authStore.getToken()),
};
