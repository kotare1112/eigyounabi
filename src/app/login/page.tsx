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
    <div className="min-h-screen flex">
      {/* 左パネル（ダーク） */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div>
          <span className="text-white font-bold text-2xl tracking-tight">営業ナビ</span>
        </div>
        <div>
          <p className="text-slate-200 text-3xl font-bold leading-snug mb-4">
            会社を検索する営業から、<br />
            売れる兆しが届く営業へ。
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            企業に起きた変化を検知し、<br />
            "買う理由が生まれた瞬間" を営業担当者に届ける SaaS です。
          </p>
        </div>
        <div className="flex gap-6 text-slate-500 text-xs">
          <span>© 2026 営業ナビ</span>
        </div>
      </div>

      {/* 右パネル（フォーム） */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">ログイン</h1>
            <p className="text-slate-500 text-sm mt-1">アカウントにサインインしてください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">メールアドレス</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
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
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6">
            初めての方は{" "}
            <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
              法人アカウントを作成
            </Link>
          </p>

          <div className="mt-6 p-3 bg-slate-100 rounded-lg text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600">デモアカウント</p>
            <p>manager@example.com / password123（マネージャー）</p>
            <p>sales@example.com / password123（営業）</p>
          </div>
        </div>
      </div>
    </div>
  );
}
