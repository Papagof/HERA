import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Renamed from `middleware.ts` in Next.js 16 - see AGENTS.md.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
