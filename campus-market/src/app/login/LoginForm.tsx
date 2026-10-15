"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_EMAIL_DOMAINS } from "@/lib/constants";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const address = email.trim().toLowerCase();
    const domain = address.split("@")[1];
    if (ALLOWED_EMAIL_DOMAINS.length && !ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      setError(`Please use your college email (${ALLOWED_EMAIL_DOMAINS.map((d) => "@" + d).join(", ")}).`);
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);

    if (error) {
      setError(
        error.message.includes("Database error")
          ? "This email domain is not allowed. Please use your college email."
          : error.message,
      );
      return;
    }
    setSent(true);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      setError("That code did not work. Check it, or request a new one.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (sent) {
    return (
      <form onSubmit={verifyCode} className="mt-6 space-y-4">
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          We emailed a sign-in link to <strong>{email}</strong>. Open it on this device, or type the code from the
          email below.
        </p>
        <div>
          <label className="label" htmlFor="code">
            Code from email
          </label>
          <input
            id="code"
            className="input tracking-widest"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || code.trim().length < 6}>
          {busy ? "Checking..." : "Sign in"}
        </button>
        <button type="button" className="btn-secondary w-full" onClick={() => setSent(false)}>
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendLink} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="email">
          College email
        </label>
        <input
          id="email"
          type="email"
          required
          className="input"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`you@${ALLOWED_EMAIL_DOMAINS[0] ?? "college.edu"}`}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Sending..." : "Email me a sign-in link"}
      </button>
    </form>
  );
}
