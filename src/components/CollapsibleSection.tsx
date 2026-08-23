"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:border-indigo-300 transition-all duration-150 group mb-4"
      >
        <span className="text-base font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
          {title}
        </span>
        <ChevronDown
          size={20}
          className={`text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && <div>{children}</div>}
    </div>
  );
}
