"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import { applyTheme, readPref, resolveTheme, savePref, subscribeTheme, type ThemePref } from "../lib/theme";

const OPTIONS: [ThemePref, string][] = [["light", "Claro"], ["dark", "Escuro"], ["system", "Sistema"]];
// Sem escolha salva o tema é o escuro, então o seletor mostra "Escuro".
const snapshot = (): ThemePref => readPref() ?? "dark";
const serverSnapshot = (): ThemePref => "dark";

const resolvedSnapshot = (): "light" | "dark" => resolveTheme(readPref());
const resolvedServer = (): "light" | "dark" => "dark";

/** Botão único do cabeçalho: o ícone indica a PRÓXIMA ação (sol no escuro, lua no claro) e um clique grava a preferência oposta à resolvida. */
function ThemeIconButton({ className }: { className: string }) {
  const theme = useSyncExternalStore(subscribeTheme, resolvedSnapshot, resolvedServer);
  const toDark = theme === "light";
  const label = toDark ? "Ativar tema escuro" : "Ativar tema claro";
  return (
    <button type="button" className={`theme-icon ${className}`.trim()} aria-label={label} title={label} onClick={() => savePref(toDark ? "dark" : "light")}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {toDark
          ? <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
          : <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" /></>}
      </svg>
    </button>
  );
}

/** Seletor de tema. Todas as instâncias leem e gravam o mesmo estado (lib/theme). */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const pref = useSyncExternalStore(subscribeTheme, snapshot, serverSnapshot);
  const name = useId();
  // Garante os atributos também após navegação do lado do cliente.
  useEffect(() => { applyTheme(readPref()); }, []);
  // No cabeçalho o controle é compacto: um seletor nativo (Claro, Escuro, Sistema), acessível por teclado e leitor de tela.
  if (className.includes("header-theme")) {
    return <ThemeIconButton className={className} />;
  }
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
