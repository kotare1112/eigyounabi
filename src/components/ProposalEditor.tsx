"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProposalEditor({
  leadId,
  initial,
}: {
  leadId: string;
  initial: { openingLine: string; proposalSummary: string; emailDraft: string; editedByUser: boolean };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [openingLine, setOpeningLine] = useState(initial.openingLine);
  const [proposalSummary, setProposalSummary] = useState(initial.proposalSummary);
  const [emailDraft, setEmailDraft] = useState(initial.emailDraft);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/leads/${leadId}/proposal`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingLine, proposalSummary, emailDraft }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500">最初の一言（架電トークスクリプト）</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{openingLine}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">提案内容の骨子</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{proposalSummary}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">メール／DM文面</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{emailDraft}</p>
        </div>
        {initial.editedByUser && (
          <p className="text-xs text-teal">※ 編集済み（自動再生成は行われません）</p>
        )}
        <button className="btn-secondary text-sm" onClick={() => setEditing(true)}>
          編集する
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">最初の一言</label>
        <textarea className="input" rows={2} value={openingLine} onChange={(e) => setOpeningLine(e.target.value)} />
      </div>
      <div>
        <label className="label">提案内容の骨子</label>
        <textarea
          className="input"
          rows={4}
          value={proposalSummary}
          onChange={(e) => setProposalSummary(e.target.value)}
        />
      </div>
      <div>
        <label className="label">メール／DM文面</label>
        <textarea className="input" rows={6} value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button className="btn-primary text-sm" onClick={handleSave} disabled={loading}>
          {loading ? "保存中..." : "保存"}
        </button>
        <button className="btn-secondary text-sm" onClick={() => setEditing(false)}>
          キャンセル
        </button>
      </div>
    </div>
  );
}
