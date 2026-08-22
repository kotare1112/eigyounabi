"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ISSUE_TAGS } from "@/lib/tags";

export type ProductFormValues = {
  id?: string;
  name: string;
  category: string;
  targetProfile: string;
  targetIndustries: string;
  targetEmployeeMin: string;
  targetEmployeeMax: string;
  referenceCases: string;
  priceRangeMin: string;
  priceRangeMax: string;
  tagCodes: string[];
};

const EMPTY: ProductFormValues = {
  name: "",
  category: "",
  targetProfile: "",
  targetIndustries: "",
  targetEmployeeMin: "",
  targetEmployeeMax: "",
  referenceCases: "",
  priceRangeMin: "",
  priceRangeMax: "",
  tagCodes: [],
};

export default function ProductForm({
  initialValues,
  redirectTo = "/products",
  submitLabel = "商品を登録",
}: {
  initialValues?: ProductFormValues;
  redirectTo?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initialValues ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleTag(code: string) {
    setValues((v) => ({
      ...v,
      tagCodes: v.tagCodes.includes(code)
        ? v.tagCodes.filter((c) => c !== code)
        : [...v.tagCodes, code],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: values.name,
      category: values.category,
      targetProfile: values.targetProfile,
      targetIndustries: values.targetIndustries,
      targetEmployeeMin: values.targetEmployeeMin ? Number(values.targetEmployeeMin) : null,
      targetEmployeeMax: values.targetEmployeeMax ? Number(values.targetEmployeeMax) : null,
      referenceCases: values.referenceCases,
      priceRangeMin: values.priceRangeMin ? Number(values.priceRangeMin) : null,
      priceRangeMax: values.priceRangeMax ? Number(values.priceRangeMax) : null,
      tagCodes: values.tagCodes,
    };

    const res = await fetch(values.id ? `/api/products/${values.id}` : "/api/products", {
      method: values.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存に失敗しました。");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">商品名</label>
        <input className="input" value={values.name} onChange={(e) => update("name", e.target.value)} required />
      </div>

      <div>
        <label className="label">商品カテゴリ</label>
        <input
          className="input"
          placeholder="例: 製造機器 / IT・SaaS / 人材 / 物流"
          value={values.category}
          onChange={(e) => update("category", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">想定顧客像（業種・規模）</label>
        <textarea
          className="input"
          rows={2}
          placeholder="例: 製造業、従業員50名以上"
          value={values.targetProfile}
          onChange={(e) => update("targetProfile", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">想定業種（カンマ区切り・任意）</label>
          <input
            className="input"
            placeholder="製造業,物流業"
            value={values.targetIndustries}
            onChange={(e) => update("targetIndustries", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">想定従業員数（下限）</label>
            <input
              className="input"
              type="number"
              value={values.targetEmployeeMin}
              onChange={(e) => update("targetEmployeeMin", e.target.value)}
            />
          </div>
          <div>
            <label className="label">想定従業員数（上限）</label>
            <input
              className="input"
              type="number"
              value={values.targetEmployeeMax}
              onChange={(e) => update("targetEmployeeMax", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="label">解決できる課題（複数選択可）</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ISSUE_TAGS.map((tag) => (
            <label key={tag.code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.tagCodes.includes(tag.code)}
                onChange={() => toggleTag(tag.code)}
              />
              {tag.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">参考導入実績・事例（任意）</label>
        <textarea
          className="input"
          rows={2}
          value={values.referenceCases}
          onChange={(e) => update("referenceCases", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">価格帯（下限・円・任意）</label>
          <input
            className="input"
            type="number"
            value={values.priceRangeMin}
            onChange={(e) => update("priceRangeMin", e.target.value)}
          />
        </div>
        <div>
          <label className="label">価格帯（上限・円・任意）</label>
          <input
            className="input"
            type="number"
            value={values.priceRangeMax}
            onChange={(e) => update("priceRangeMax", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
