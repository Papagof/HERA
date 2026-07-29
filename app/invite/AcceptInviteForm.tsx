"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { labelClass } from "@/components/ui/fieldStyles";

type Status = "checking" | "ready" | "invalid";

export function AcceptInviteForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // The invite link's session token arrives in the URL hash fragment
    // (#access_token=...&refresh_token=...). @supabase/ssr's cookie-backed
    // browser client doesn't reliably auto-detect this the way plain
    // supabase-js's localStorage-backed client does, so it's parsed and
    // exchanged for a session explicitly.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          setStatus(!error && data.session ? "ready" : "invalid");
          if (!error) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        });
      return;
    }

    // No tokens in the URL (e.g. a page refresh after the hash was already
    // consumed) - fall back to whatever session already exists.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? "ready" : "invalid");
    });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (status === "checking") {
    return (
      <Card>
        <p className="text-sm text-slate-500 dark:text-slate-400">Checking your invite link...</p>
      </Card>
    );
  }

  if (status === "invalid") {
    return (
      <Card>
        <p className="text-sm text-red-600 dark:text-red-400">
          This invite link is invalid or has expired. Ask a super_admin to send you a new one from
          the Users page.
        </p>
        <a href="/login" className="mt-3 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          Go to login
        </a>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
        Set your password
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="confirm_password">
            Confirm password
          </label>
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Setting password..." : "Set password and continue"}
        </Button>
      </form>
    </Card>
  );
}
