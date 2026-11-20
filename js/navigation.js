import { api, clearToken, getToken } from "./api.js";

const right = document.querySelector(".nav-right");
function addLoginLink() {
  if (!right || right.querySelector(".login-nav-link")) return;
  const login = document.createElement("a");
  login.className = "nav-link login-nav-link";
  login.href = "index.html";
  login.textContent = "Iniciar sesión";
  right.append(login);
}

if (right && !getToken()) addLoginLink();
if (right && getToken()) {
  try {
    const user = await api("/auth/me");
    const label = document.createElement("span");
    label.textContent = user.name;
    right.append(label);
    if (user.role === "admin" && !location.pathname.endsWith("/admin.html")) {
      const admin = document.createElement("a");
      admin.className = "nav-link";
      admin.href = "admin.html";
      admin.textContent = "Administración";
      right.append(admin);
    }
    const logout = document.createElement("button");
    logout.className = "btn";
    logout.type = "button";
    logout.textContent = "Cerrar sesión";
    logout.addEventListener("click", async () => {
      try {
        await api("/auth/logout", { method: "POST" });
      } finally {
        clearToken();
        location.href = "index.html";
      }
    });
    right.append(logout);
  } catch (error) {
    if (error.status === 401) {
      clearToken();
      addLoginLink();
    } else {
      console.error("No se pudo cargar la sesión de navegación.", error);
    }
  }
}
