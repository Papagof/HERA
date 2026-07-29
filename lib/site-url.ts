import { headers } from "next/headers";

// Used to build absolute redirect URLs for Supabase Auth emails (invite,
// password reset, etc). Prefers NEXT_PUBLIC_SITE_URL so production always
// redirects to the real domain regardless of which host served the request
// (useful behind a proxy/load balancer); falls back to the request's own
// host, which is what makes this work out of the box on localhost during
// dev without any extra config.
export async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}
