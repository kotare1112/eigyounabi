"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExcludeLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleExclude() {
    if (!confirm("このリードを対象外（NG）にしますか？")) return;
    setLoading(true);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "EXCLUDED" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleExclude} disabled={loading} className="text-xs text-gray-400 hover:text-red-500">
      対象外にする
    </button>
  );
}
