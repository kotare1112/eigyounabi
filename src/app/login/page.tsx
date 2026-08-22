"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("manager@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "ログインに失敗しました。");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm card">
        <h1 className="text-2xl font-bold text-navy mb-1">営業ナビ</h1>
        <p className="text-sm text-gray-500 mb-6">会社を検索する営業から、売れる兆しが届く営業へ。</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">メールアドレス</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">パスワード</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4">
          初めての方は{" "}
          <Link href="/signup" className="text-navy underline">
            法人アカウントを作成
          </Link>
        </p>
        <p className="text-xs text-gray-400 mt-4">
          デモ用: manager@example.com / password123（マネージャー）<br />
          sales@example.com / password123（営業）
        </p>
      </div>
    </div>
  );
}
