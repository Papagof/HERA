"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { labelClass } from "@/components/ui/fieldStyles";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);

    // Supabase doesn't reveal whether an account exists for this email, so
    // this shows the same success message either way rather than leaking
    // that as an error.
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Card>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent to
          it. Check your inbox (and spam folder).
        </p>
        <a href="/login" className="mt-3 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          Back to login
        </a>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
        Reset your password
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending..." : "Send reset link"}
        </Button>
        <a href="/login" className="block text-center text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          Back to login
        </a>
      </form>
    </Card>
  );
}
