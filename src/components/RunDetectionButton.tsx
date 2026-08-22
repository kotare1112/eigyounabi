"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunDetectionButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/batch/detect", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      setMessage("検知処理に失敗しました。");
      return;
    }
    const data = await res.json();
    setMessage(
      `検知完了: 新規イベント${data.detect.created}件 / スコア更新${data.leads.updated}件`
    );
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={handleRun} disabled={loading} className="btn-secondary text-sm">
        {loading ? "検知中..." : "今すぐ変化を検知する（日次バッチの手動実行）"}
      </button>
      {message && <span className="text-xs text-gray-500">{message}</span>}
    </div>
  );
}
