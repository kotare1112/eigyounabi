"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteUserForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SALES");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "追加に失敗しました。");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
      <input className="input" placeholder="お名前" value={name} onChange={(e) => setName(e.target.value)} required />
      <input
        className="input"
        placeholder="メールアドレス"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="input"
        placeholder="初期パスワード（8文字以上）"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="SALES">営業担当者</option>
        <option value="MANAGER">マネージャー</option>
      </select>
      {error && <p className="text-sm text-red-600 col-span-2">{error}</p>}
      <button type="submit" className="btn-primary col-span-2" disabled={loading}>
        {loading ? "追加中..." : "メンバーを追加"}
      </button>
    </form>
  );
}
