const TOKEN_KEY = "lae_access_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`/api${path}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) clearToken();
    const error = new Error(result.error?.message || "No fue posible completar la solicitud.");
    error.status = response.status;
    throw error;
  }
  return result.data;
}

export function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2
  }).format(Number(value));
}

export function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("texto-error", isError);
  element.classList.toggle("texto-exito", !isError && Boolean(message));
}
