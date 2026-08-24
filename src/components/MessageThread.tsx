"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

type ChatMessage = {
  id: string;
  sender: "SALES" | "COMPANY";
  body: string;
  createdAt: string;
  senderUserName: string | null;
};

export default function MessageThread({
  companyId,
  companyName,
  leadScoreId,
  initialMessages,
}: {
  companyId: string;
  companyName: string;
  leadScoreId: string | null;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, leadScoreId, body }),
    });

    if (!res.ok) {
      setSending(false);
      return;
    }

    const { salesMessage, companyReply } = await res.json();
    setMessages((prev) => [
      ...prev,
      {
        id: salesMessage.id,
        sender: "SALES",
        body: salesMessage.body,
        createdAt: salesMessage.createdAt,
        senderUserName: null,
      },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: companyReply.id,
          sender: "COMPANY",
          body: companyReply.body,
          createdAt: companyReply.createdAt,
          senderUserName: null,
        },
      ]);
      setSending(false);
      router.refresh();
    }, 1000);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="font-bold text-slate-800">{companyName}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-8">
            まだメッセージがありません。最初のメッセージを送ってみましょう。
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "SALES" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                m.sender === "SALES"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-100 p-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="メッセージを入力..."
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40"
          aria-label="送信"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
