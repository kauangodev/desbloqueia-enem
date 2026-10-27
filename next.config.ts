import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hostinger's current Node runtime may expose an older glibc than the
  // native Next SWC binary expects. Keep the build portable by using the
  // official WASM compiler fallback bundled with the same Next release.
  experimental: { useWasmBinary: true },
  poweredByHeader: false,
  outputFileTracingIncludes: { "/aluno/[section]": ["./data/library.json"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
