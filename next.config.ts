import type { NextConfig } from "next";

/* Defense-in-depth headers for a static content site. script-src needs
   'unsafe-inline' for Next's hydration bootstrap on static pages (no nonces
   without dynamic rendering); va.vercel-scripts.com is Vercel Analytics.
   Dev only: React needs eval() for its debugging features, and HMR uses a
   websocket — neither relaxation ships in the production build. */
const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self'${isDev ? " ws:" : ""}`,
      "frame-ancestors 'none'"
    ].join("; ")
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  }
};

export default nextConfig;
