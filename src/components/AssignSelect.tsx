"use client";

import { useRouter } from "next/navigation";

export default function AssignSelect({
  leadId,
  currentUserId,
  members,
}: {
  leadId: string;
  currentUserId: string | null;
  members: { id: string; name: string }[];
}) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedUserId: value }),
    });
    router.refresh();
  }

  return (
    <select
      className="text-xs border border-gray-300 rounded px-1 py-0.5"
      defaultValue={currentUserId ?? ""}
      onChange={handleChange}
    >
      <option value="">未割当</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
