import { api, clearToken, getToken, setToken, showMessage } from "./api.js";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const message = document.querySelector("#auth-message");

document.querySelector("#show-register").addEventListener("click", (event) => {
  event.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  showMessage(message, "");
});

document.querySelector("#show-login").addEventListener("click", (event) => {
  event.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  showMessage(message, "");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  const button = loginForm.querySelector("button[type=submit]");
  button.disabled = true;
  showMessage(message, "Iniciando sesión...");
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: loginForm.email.value.trim(),
        password: loginForm.password.value
      })
    });
    setToken(data.token);
    location.href = data.user.role === "admin" ? "admin.html" : "productos.html";
  } catch (error) {
    showMessage(message, error.message, true);
  } finally {
    button.disabled = false;
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!registerForm.reportValidity()) return;
  const button = registerForm.querySelector("button[type=submit]");
  button.disabled = true;
  showMessage(message, "Creando cuenta...");
  try {
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: registerForm.name.value.trim(),
        email: registerForm.email.value.trim(),
        password: registerForm.password.value
      })
    });
    setToken(data.token);
    location.href = "productos.html";
  } catch (error) {
    showMessage(message, error.message, true);
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#forgot-password").addEventListener("click", async (event) => {
  event.preventDefault();
  const email = window.prompt("Escribe el correo de tu cuenta:");
  if (!email) return;
  try {
    const result = await api("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    if (result.resetToken) {
      const token = window.prompt(
        `Token temporal de prueba (no se envió por correo): ${result.resetToken}\nPégalo para continuar:`,
        result.resetToken
      );
      if (!token) return;
      const password = window.prompt("Nueva contraseña (mínimo 8 caracteres):");
      if (!password) return;
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, password })
      });
      showMessage(message, "Contraseña actualizada. Ya puedes iniciar sesión.");
    } else {
      showMessage(message, result.message);
    }
  } catch (error) {
    showMessage(message, error.message, true);
  }
});

if (getToken()) {
  try {
    const user = await api("/auth/me");
    location.replace(user.role === "admin" ? "admin.html" : "productos.html");
  } catch (error) {
    if (error.status === 401) clearToken();
    else showMessage(message, error.message, true);
  }
}
