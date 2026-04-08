"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(
    error === "CredentialsSignin" ? "Invalid email or password" : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setFormError("Invalid email or password");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleOAuth(provider: "google" | "linkedin") {
    await signIn(provider, { callbackUrl });
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-midnight font-serif mb-1">Sign in</h3>
      <p className="text-[13px] text-midnight-300 mb-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-honey font-semibold hover:underline">Sign up</Link>
      </p>

      {formError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {formError}
        </div>
      )}

      <div className="flex gap-3 mb-5">
        <button
          onClick={() => handleOAuth("google")}
          className="flex-1 py-2.5 rounded-xl border border-cream-200 bg-white text-[13px] font-semibold text-midnight hover:border-honey/30 transition-colors"
        >
          🔵 Google
        </button>
        <button
          onClick={() => handleOAuth("linkedin")}
          className="flex-1 py-2.5 rounded-xl border border-cream-200 bg-white text-[13px] font-semibold text-midnight hover:border-honey/30 transition-colors"
        >
          🔗 LinkedIn
        </button>
      </div>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-cream-200" />
        <span className="text-xs text-midnight-200">or</span>
        <div className="flex-1 h-px bg-cream-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-midnight mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.eu"
            className="input"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-midnight mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="input"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-midnight-300 cursor-pointer">
            <input type="checkbox" className="rounded border-cream-200" /> Remember me
          </label>
          <Link href="/forgot-password" className="text-honey font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button fullWidth size="lg" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
