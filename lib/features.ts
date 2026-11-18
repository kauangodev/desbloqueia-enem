/**
 * Chaves de funcionalidade. Para reativar a Redação para os alunos, basta mudar `redacao` para `true`
 * (ou definir NEXT_PUBLIC_FEATURE_REDACAO=1): o código, os dados e os históricos foram preservados.
 * `gratis` (NEXT_PUBLIC_FEATURE_GRATIS=1) abre o cadastro público e o plano Grátis; desligado, nada muda para ninguém.
 * `google` (NEXT_PUBLIC_FEATURE_GOOGLE=1) mostra "Continuar com Google" e exige `gratis` + GOOGLE_CLIENT_ID/SECRET no servidor.
 */
export const features = {
  redacao: process.env.NEXT_PUBLIC_FEATURE_REDACAO === "1",
  gratis: process.env.NEXT_PUBLIC_FEATURE_GRATIS === "1",
  google: process.env.NEXT_PUBLIC_FEATURE_GOOGLE === "1",
} as const;
