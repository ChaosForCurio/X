import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', 'three', '@react-three/fiber'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.notebookcheck.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.freesound.org',
      },
      {
        protocol: 'https',
        hostname: 'freesound.org',
      },
      {
        protocol: 'https',
        hostname: '*.freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      // Shopping image domains
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: '*.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazon.com',
      },
      {
        protocol: 'https',
        hostname: '*.flipkart.com',
      },
      {
        protocol: 'https',
        hostname: '*.flixcart.com',
      },
      {
        protocol: 'https',
        hostname: '*.myntra.com',
      },
      {
        protocol: 'https',
        hostname: '*.myntassets.com',
      },
      {
        protocol: 'https',
        hostname: '*.ajio.com',
      },
      {
        protocol: 'https',
        hostname: '*.jiomart.com',
      },
      {
        protocol: 'https',
        hostname: '*.snapdeal.com',
      },
      {
        protocol: 'https',
        hostname: '*.walmartimages.com',
      },
      {
        protocol: 'https',
        hostname: '*.googlecommerce.com',
      },
      {
        protocol: 'https',
        hostname: 'shopping-phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: '*.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'target.scene7.com',
      },
      {
        protocol: 'https',
        hostname: '*.target.com',
      },
      {
        protocol: 'https',
        hostname: '*.bestbuy.com',
      },
      {
        protocol: 'https',
        hostname: 'pisces.bbystatic.com',
      },
      {
        protocol: 'https',
        hostname: '*.ebayimg.com',
      },
      {
        protocol: 'https',
        hostname: '*.apple.com',
      },
      {
        protocol: 'https',
        hostname: 'store.storeimages.cdn-apple.com',
      },
      {
        protocol: 'https',
        hostname: '*.samsung.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
    // Security: disallow SVG to reduce XSS vectors via inline scripts
    dangerouslyAllowSVG: false,
    // Keep default content disposition; avoid forcing attachment which can break previews
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            // Note: 'unsafe-eval' may be required in development by certain tooling; keep only if necessary.
            // Inline styles allowed for Tailwind runtime injection; consider CSP nonces for stricter policies.
            value: "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' https:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stackframe.co https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self' https:; worker-src 'self' blob:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self';"
          }
        ]
      }
    ];
  },
};

export default nextConfig;
