export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "28476913325342920";

export type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "InitiateCheckout"
  | "Purchase";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[][];
      loaded?: boolean;
      version?: string;
      push?: unknown;
      callMethod?: (...args: unknown[]) => void;
    };
  }
}

export function hasMarketingConsent() {
  return typeof window !== "undefined" && localStorage.getItem("godev-consent") === "accepted";
}

export function trackMetaEvent(
  event: MetaEventName,
  parameters?: Record<string, string | number>,
) {
  if (!hasMarketingConsent() || typeof window.fbq !== "function") return false;
  window.fbq("track", event, parameters || {});
  return true;
}
