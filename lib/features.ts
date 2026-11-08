/**
 * Chaves de funcionalidade. Para reativar a Redação para os alunos, basta mudar `redacao` para `true`
 * (ou definir NEXT_PUBLIC_FEATURE_REDACAO=1): o código, os dados e os históricos foram preservados.
 */
export const features = {
  redacao: process.env.NEXT_PUBLIC_FEATURE_REDACAO === "1",
} as const;
