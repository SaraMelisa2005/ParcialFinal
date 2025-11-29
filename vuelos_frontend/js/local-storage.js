// local-storage.js

const KEY_USER = "VUELOS_USER";
const KEY_TOKEN = "VUELOS_TOKEN";

/** Guarda usuario + token */
export function saveSession(user, token) {
  localStorage.setItem(KEY_USER, JSON.stringify(user));
  localStorage.setItem(KEY_TOKEN, token);
}

/** Guarda solo el usuario (sin afectar token) */
export function saveUser(user) {
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}

/** Obtiene el usuario de la sesión */
export function getUser() {
  const data = localStorage.getItem(KEY_USER);
  return data ? JSON.parse(data) : null;
}

/** Obtiene el token JWT */
export function getToken() {
  return localStorage.getItem(KEY_TOKEN);
}

/** Elimina usuario y token */
export function logout() {
  localStorage.removeItem(KEY_USER);
  localStorage.removeItem(KEY_TOKEN);
  window.location.href = "login.html";
}