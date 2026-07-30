import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Only relevant while logged out; a signed-in user is bounced to /dashboard.
const AUTH_PATHS = ["/login"];

// Always public, whether or not the visitor is signed in (marketing/listings
// pages, plus their inquiry-form submissions). /invite must be public too:
// an invite/recovery link lands here with the session token only in the URL
// hash fragment, which the server never sees - if this redirected to /login
// before the browser JS ran, the token would be lost.
//
// "/" is matched via the same `pathname === prefix || pathname.startsWith(`${prefix}/`)`
// check below - for prefix "/" that's `pathname === "/" || pathname.startsWith("//")`,
// which only ever matches the root path itself, not every route.
const PUBLIC_PATH_PREFIXES = ["/", "/listings", "/invite", "/about", "/contact"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Revalidates the session with Supabase Auth on every request; don't
  // remove or replace with getSession(), which only reads the local cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPath = AUTH_PATHS.includes(pathname);
  const isAlwaysPublicPath = PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!user && !isAuthPath && !isAlwaysPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
