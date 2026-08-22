"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("この商品を削除しますか？関連する営業先の優先度データも削除されます。")) return;
    setLoading(true);
    await fetch(`/api/products/${productId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-secondary text-sm text-red-600 border-red-300">
      削除
    </button>
  );
}
