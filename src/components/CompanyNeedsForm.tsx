"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ISSUE_TAGS } from "@/lib/tags";

export default function CompanyNeedsForm({
  companyId,
  initialTagCodes,
}: {
  companyId: string;
  initialTagCodes: string[];
}) {
  const router = useRouter();
  const [tagCodes, setTagCodes] = useState<string[]>(initialTagCodes);
  const [saving, setSaving] = useState(false);

  function toggle(code: string) {
    setTagCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/companies/${companyId}/needs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagCodes }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ISSUE_TAGS.map((tag) => (
          <label key={tag.code} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={tagCodes.includes(tag.code)}
              onChange={() => toggle(tag.code)}
            />
            {tag.label}
          </label>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-secondary text-sm">
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
