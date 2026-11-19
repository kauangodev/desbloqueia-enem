/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger's current Node runtime may expose an older glibc than the
  // native Next SWC binary expects. Use the official WASM compiler fallback.
  experimental: { useWasmBinary: true },
  poweredByHeader: false,
  outputFileTracingIncludes: { "/*": ["./data/library.json", "./private/materials/**/*"] },
  // Endereço antigo da área de Matemática e Natureza. 307 (temporário) durante a virada: um rollback não deixa o navegador preso a um redirecionamento 308 em cache.
  async redirects() {
    return [
      { source: "/aluno/operacao-segundo-domingo", destination: "/aluno/matematica-natureza", permanent: false },
      { source: "/aluno/operacao-segundo-domingo/:path*", destination: "/aluno/matematica-natureza/:path*", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/vendor/:path*.mjs",
        headers: [{ key: "Content-Type", value: "application/javascript; charset=utf-8" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=15552000" },
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
