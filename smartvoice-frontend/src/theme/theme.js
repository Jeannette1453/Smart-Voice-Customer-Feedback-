export const getTheme = () => {
  return localStorage.getItem("theme") || "light";
};

export const setTheme = (theme) => {
  localStorage.setItem("theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
};

export const toggleTheme = () => {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
};