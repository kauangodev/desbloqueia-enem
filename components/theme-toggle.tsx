"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import { applyTheme, readPref, savePref, subscribeTheme, type ThemePref } from "../lib/theme";

const OPTIONS: [ThemePref, string][] = [["light", "Claro"], ["dark", "Escuro"], ["system", "Sistema"]];
// Sem escolha salva o tema é o escuro, então o seletor mostra "Escuro".
const snapshot = (): ThemePref => readPref() ?? "dark";
const serverSnapshot = (): ThemePref => "dark";

/** Seletor de tema. Todas as instâncias leem e gravam o mesmo estado (lib/theme). */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const pref = useSyncExternalStore(subscribeTheme, snapshot, serverSnapshot);
  const name = useId();
  // Garante os atributos também após navegação do lado do cliente.
  useEffect(() => { applyTheme(readPref()); }, []);
  return (
    <fieldset className={`theme-switch ${className}`.trim()}>
      <legend>Tema</legend>
      {OPTIONS.map(([value, label]) => (
        <label key={value}>
          <input type="radio" name={`gd-theme-${name}`} value={value} checked={pref === value} onChange={() => savePref(value)} />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
