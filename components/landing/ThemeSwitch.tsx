"use client";

import { useEffect, useState } from "react";

type Pref = "light" | "dark" | "system";
const KEY = "godev-theme";

function apply(pref: Pref) {
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-gd-theme", dark ? "dark" : "light");
  document.documentElement.setAttribute("data-gd-pref", pref);
}

function read(): Pref {
  try { const v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : "system"; } catch { return "system"; }
}

/** Preferência opcional de aparência. Sem escolha salva, segue o dispositivo. */
export default function ThemeSwitch() {
  const [pref, setPref] = useState<Pref>("system");
  useEffect(() => {
    const current = read();
    setPref(current);
    apply(current);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if (read() === "system") apply("system"); };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  const choose = (next: Pref) => {
    setPref(next);
    try { if (next === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, next); } catch {}
    apply(next);
  };
  const options: [Pref, string][] = [["light", "Claro"], ["dark", "Escuro"], ["system", "Sistema"]];
  return (
    <fieldset className="s-theme">
      <legend>Aparência</legend>
      {options.map(([value, label]) => (
        <label key={value}>
          <input type="radio" name="godev-theme" value={value} checked={pref === value} onChange={() => choose(value)} />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
