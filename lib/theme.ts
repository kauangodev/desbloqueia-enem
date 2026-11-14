// Preferência de tema das páginas públicas (landing, atendimento, políticas, entrada).
// Regra: sem escolha salva = escuro (identidade GoDev). "light" e "dark" são fixos; "system" acompanha o dispositivo
// e é gravado de forma explícita, para diferenciar "nenhuma escolha" de "Sistema escolhido".
export type ThemePref = "light" | "dark" | "system";
export const THEME_KEY = "godev-theme";
export const THEME_EVENT = "godev-theme-change";

/** Script inline (executado antes da pintura) que define data-gd-theme e data-gd-pref no <html>. */
export const THEME_BOOT_SCRIPT =
  '(function(){try{var d=document.documentElement,p=null;try{p=localStorage.getItem("godev-theme")}catch(e){}' +
  'var ok=p==="light"||p==="dark"||p==="system";var dark=!ok||p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);' +
  'd.setAttribute("data-gd-theme",dark?"dark":"light");d.setAttribute("data-gd-pref",ok?p:"default")}catch(e){}})();';

export function readPref(): ThemePref | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : null;
  } catch {
    return null;
  }
}

export function resolveTheme(pref: ThemePref | null): "light" | "dark" {
  if (pref === "light") return "light";
  if (pref === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return "dark";
}

export function applyTheme(pref: ThemePref | null) {
  const root = document.documentElement;
  root.setAttribute("data-gd-theme", resolveTheme(pref));
  root.setAttribute("data-gd-pref", pref ?? "default");
}

export function savePref(pref: ThemePref) {
  try { window.localStorage.setItem(THEME_KEY, pref); } catch { /* armazenamento opcional */ }
  applyTheme(pref);
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** Assinatura usada por todos os seletores: mesma fonte de estado, atualização conjunta. */
export function subscribeTheme(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => { if (readPref() === "system") applyTheme("system"); callback(); };
  const onOther = () => { applyTheme(readPref()); callback(); };
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", onOther);
  media.addEventListener("change", onMedia);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", onOther);
    media.removeEventListener("change", onMedia);
  };
}
