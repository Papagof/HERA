"use client";

import { useEffect } from "react";

// After a redeploy, a tab left open from the previous build references
// content-hashed chunk filenames that no longer exist, throwing
// "Loading chunk ... failed" - a hard refresh is the fix, not a code bug.
// See AGENTS.md in the sibling Happyland Estate project for the same issue.
const RELOAD_FLAG = "hera:chunk-reload";

export function ChunkErrorReload() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      const isChunkError =
        /loading chunk/i.test(event.message ?? "") ||
        /ChunkLoadError/i.test(event.error?.name ?? "");
      if (!isChunkError) return;

      // Guard against an infinite reload loop if the chunk is genuinely
      // missing (a bad deploy) rather than just stale - only auto-reload
      // once per tab session.
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    }

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return null;
}
