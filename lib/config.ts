export const product = {
  name: "Kit Reta Final ENEM 2026",
  price: "R$ 29,90",
  checkoutUrl: process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "suporte@configurar.exemplo",
  pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  analyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "",
} as const;

export const examDates = [new Date("2026-11-08T00:00:00-03:00"), new Date("2026-11-15T00:00:00-03:00")];
