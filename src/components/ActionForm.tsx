"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACTION_TYPE_LABEL, RESULT_OPTIONS } from "@/lib/actionResults";

export default function ActionForm({
  companyId,
  leadOptions,
}: {
  companyId: string;
  leadOptions: { id: string; productName: string }[];
}) {
  const router = useRouter();
  const [leadScoreId, setLeadScoreId] = useState(leadOptions[0]?.id ?? "");
  const [actionType, setActionType] = useState("CALL");
  const [result, setResult] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/companies/${companyId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadScoreId: leadScoreId || null,
        actionType,
        result: result || null,
        note: note || null,
      }),
    });
    setLoading(false);
    setNote("");
    setResult("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">対象商品</label>
          <select className="input" value={leadScoreId} onChange={(e) => setLeadScoreId(e.target.value)}>
            {leadOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.productName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">アクション種別</label>
          <select className="input" value={actionType} onChange={(e) => setActionType(e.target.value)}>
            {Object.entries(ACTION_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">結果</label>
        <select className="input" value={result} onChange={(e) => setResult(e.target.value)}>
          <option value="">未選択</option>
          {RESULT_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">メモ</label>
        <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <button type="submit" className="btn-primary text-sm" disabled={loading}>
        {loading ? "記録中..." : "アクションを記録"}
      </button>
    </form>
  );
}
