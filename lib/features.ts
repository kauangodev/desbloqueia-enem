/**
 * Chaves de funcionalidade. Para reativar a Redação para os alunos, basta mudar `redacao` para `true`
 * (ou definir NEXT_PUBLIC_FEATURE_REDACAO=1): o código, os dados e os históricos foram preservados.
 * `gratis` (NEXT_PUBLIC_FEATURE_GRATIS=1) abre o cadastro público e o plano Grátis; desligado, nada muda para ninguém.
 * `google` (NEXT_PUBLIC_FEATURE_GOOGLE=1) mostra "Continuar com Google" e exige `gratis` + GOOGLE_CLIENT_ID/SECRET no servidor.
 * `pix` (NEXT_PUBLIC_FEATURE_PIX=1) é o CORTE COMERCIAL: compras novas passam ao checkout Pix da GoDev, sem a taxa de R$ 0,99 da Cakto, e
 * `/api/checkout/*` deixa de abrir a Cakto. O webhook e os pedidos antigos continuam intactos.
 */
export const features = {
  redacao: process.env.NEXT_PUBLIC_FEATURE_REDACAO === "1",
  /** Ligadas por padrão (decisão do proprietário): defina NEXT_PUBLIC_FEATURE_GRATIS=0 / NEXT_PUBLIC_FEATURE_PIX=0 para voltar ao comportamento anterior. */
  gratis: process.env.NEXT_PUBLIC_FEATURE_GRATIS !== "0",
  google: process.env.NEXT_PUBLIC_FEATURE_GOOGLE === "1",
  pix: process.env.NEXT_PUBLIC_FEATURE_PIX !== "0",
  /** `onboarding` (NEXT_PUBLIC_FEATURE_ONBOARDING=1): modal de 3 etapas no primeiro acesso. Ligar só depois da revisão jurídica da coleta da data de nascimento. */
  onboarding: process.env.NEXT_PUBLIC_FEATURE_ONBOARDING === "1",
} as const;
