

const KEY_TOKEN = 'jwt_token';
const KEY_USER = 'jwt_user';


export function getToken() {
  return localStorage.getItem(KEY_TOKEN);
}

export function setToken(token) {
  localStorage.setItem(KEY_TOKEN, token);
}

export function removeToken() {
  localStorage.removeItem(KEY_TOKEN);
}


export function getUser() {
  const data = localStorage.getItem(KEY_USER);
  return data ? JSON.parse(data) : null;
}

export function setUser(user) {
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}

export function removeUser() {
  localStorage.removeItem(KEY_USER);
}


export function logout() {
  removeToken();
  removeUser();
  window.location.href = 'login.html';
}