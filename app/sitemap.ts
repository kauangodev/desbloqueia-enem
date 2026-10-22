import type { MetadataRoute } from "next";
import { appUrl } from "../lib/config";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/suporte",
    "/politicas/privacidade",
    "/politicas/termos",
    "/politicas/reembolso",
  ].map((path) => ({
    url: appUrl + path,
    changeFrequency: "monthly",
    priority: path ? 0.4 : 1,
  }));
}
