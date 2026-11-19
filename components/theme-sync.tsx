"use client";

import { useEffect } from "react";
import { applyTheme, readPref, subscribeTheme } from "../lib/theme";

/**
 * Mantém o tema em sincronia em TODAS as áreas, mesmo onde nenhum seletor está montado (ex.: uma aba do admin já aberta):
 * reaplica ao mudar a preferência em outra aba (evento storage), ao trocar na mesma aba e ao mudar o tema do sistema (só no modo Sistema).
 */
export default function ThemeSync() {
  useEffect(() => {
    applyTheme(readPref());
    return subscribeTheme(() => undefined);
  }, []);
  return null;
}
