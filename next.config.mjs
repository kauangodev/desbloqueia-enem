/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger's current Node runtime may expose an older glibc than the
  // native Next SWC binary expects. Use the official WASM compiler fallback.
  experimental: { useWasmBinary: true },
  poweredByHeader: false,
  outputFileTracingIncludes: { "/*": ["./data/library.json", "./private/materials/**/*"] },
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
