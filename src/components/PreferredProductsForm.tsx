"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";

type DesiredProductItem = {
  id: string;
  name: string;
  memo: string | null;
  createdByUserName: string | null;
};

export default function DesiredProductsManager({
  initialItems,
}: {
  initialItems: DesiredProductItem[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/preferred-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, memo }),
    });
    setName("");
    setMemo("");
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch("/api/preferred-products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">商品・サービス名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：SFAツール〇〇"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">メモ（任意）</label>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="導入したい理由など"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !name.trim()}
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <Plus size={15} />
          {saving ? "追加中..." : "追加する"}
        </button>
      </div>

      {initialItems.length === 0 ? (
        <div className="card text-sm text-slate-500">
          まだ登録されていません。導入したいサービスや欲しい商品を追加してください。
        </div>
      ) : (
        <div className="space-y-3">
          {initialItems.map((item) => (
            <div key={item.id} className="card flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-slate-800">{item.name}</p>
                {item.memo && <p className="text-sm text-slate-500 mt-0.5">{item.memo}</p>}
                {item.createdByUserName && (
                  <p className="text-xs text-slate-400 mt-1">登録者：{item.createdByUserName}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="text-slate-400 hover:text-red-500 shrink-0 p-1"
                aria-label="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
