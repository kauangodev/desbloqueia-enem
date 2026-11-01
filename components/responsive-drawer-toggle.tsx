"use client";

import { useEffect, useRef, useState } from "react";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default function ResponsiveDrawerToggle({ target, label }: { target: "student" | "admin"; label: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const body = document.body;
    if (open) body.dataset.drawerOpen = target;
    else if (body.dataset.drawerOpen === target) delete body.dataset.drawerOpen;
    body.style.overflow = open ? "hidden" : "";
    return () => {
      if (body.dataset.drawerOpen === target) delete body.dataset.drawerOpen;
      body.style.overflow = "";
    };
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button ref={triggerRef} className="drawer-trigger" type="button" aria-label={open ? `Fechar menu ${label}` : `Abrir menu ${label}`} aria-expanded={open} aria-controls={`${target}-navigation`} onClick={() => setOpen((value) => !value)}>
        <MenuIcon />
      </button>
      {open ? <button className="drawer-backdrop" type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} /> : null}
    </>
  );
}
