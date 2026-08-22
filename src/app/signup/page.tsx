"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, name, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "登録に失敗しました。");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm card">
        <h1 className="text-2xl font-bold text-navy mb-1">法人アカウント作成</h1>
        <p className="text-sm text-gray-500 mb-6">最初のユーザーはマネージャー権限になります。</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">会社名</label>
            <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>
          <div>
            <label className="label">お名前</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
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
            <label className="label">パスワード（8文字以上）</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "作成中..." : "アカウントを作成"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4">
          既にアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-navy underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
