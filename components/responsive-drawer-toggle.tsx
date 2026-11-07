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
    const navigation = document.getElementById(`${target}-navigation`);
    const focusables = () => Array.from(navigation?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]') || []).filter((node) => node.getClientRects().length);
    const frame = requestAnimationFrame(() => focusables()[0]?.focus());
    const close = () => { setOpen(false); triggerRef.current?.focus(); };
    const onNavigate = (event: MouseEvent) => { if ((event.target as Element).closest('a[href]')) close(); };
    navigation?.addEventListener('click', onNavigate);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault(); close();
      }
      if (event.key === "Tab") {
        const items = [...focusables(), triggerRef.current].filter((node): node is HTMLElement => !!node);
        const index = items.indexOf(document.activeElement as HTMLElement);
        if (index < 0 || (!event.shiftKey && index === items.length - 1) || (event.shiftKey && index === 0)) {
          event.preventDefault(); items[event.shiftKey ? items.length - 1 : 0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { cancelAnimationFrame(frame); navigation?.removeEventListener('click', onNavigate); document.removeEventListener("keydown", onKeyDown); };
  }, [open, target]);

  return (
    <>
      <button ref={triggerRef} className="drawer-trigger" type="button" aria-label={open ? `Fechar menu ${label}` : `Abrir menu ${label}`} aria-expanded={open} aria-controls={`${target}-navigation`} onClick={() => setOpen((value) => !value)}>
        <MenuIcon />
      </button>
      {open ? <button className="drawer-backdrop" type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} /> : null}
    </>
  );
}
