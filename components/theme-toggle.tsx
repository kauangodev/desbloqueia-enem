"use client";

import { useEffect, useRef, useState } from "react";

type ThemeChoice = "light" | "dark" | "system";

function resolvedTheme(choice: ThemeChoice) {
  if (choice !== "system") return choice;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(choice: ThemeChoice) {
  document.documentElement.dataset.themeChoice = choice;
  document.documentElement.dataset.theme = resolvedTheme(choice);
}

export default function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const choiceRef = useRef<ThemeChoice>("system");

  useEffect(() => {
    const saved = window.localStorage.getItem("godev-theme") as ThemeChoice | null;
    const next = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setChoice(next);
    choiceRef.current = next;
    applyTheme(next);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if (choiceRef.current === "system") applyTheme("system"); };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  function select(next: ThemeChoice) {
    setChoice(next);
    choiceRef.current = next;
    try { window.localStorage.setItem("godev-theme", next); } catch { /* armazenamento opcional */ }
    applyTheme(next);
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Tema da interface">
      <span className="theme-toggle-label">Tema</span>
      {(["light", "dark", "system"] as ThemeChoice[]).map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={choice === item}
          onClick={() => select(item)}
          title={item === "light" ? "Tema claro" : item === "dark" ? "Tema escuro" : "Seguir o sistema"}
        >
          {item === "light" ? "Claro" : item === "dark" ? "Escuro" : "Sistema"}
        </button>
      ))}
    </div>
  );
}
