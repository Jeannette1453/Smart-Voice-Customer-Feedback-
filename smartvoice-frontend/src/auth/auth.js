export const TOKEN_KEY = "token";

/* Save token */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/* Get token */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/* Logout */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("fullName");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
}

/* Check login status */
export function isLoggedIn() {
  const token = getToken();
  return !!token;
}

/* Decode JWT */
export function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/* Get role */
export function getRole() {
  const token = getToken();
  const payload = token ? parseJwt(token) : null;
  return payload?.role || localStorage.getItem("role") || "";
}

/* Get email */
export function getEmail() {
  const token = getToken();
  const payload = token ? parseJwt(token) : null;
  return payload?.sub || payload?.email || localStorage.getItem("email") || "";
}

/* Get full name */
export function getFullName() {
  return localStorage.getItem("fullName") || "";
}