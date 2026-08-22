import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { runDetectionBatch } from "@/lib/detection";
import { recalcLeadsForTenant } from "@/lib/leads";

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  if (session.role !== "MANAGER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const detect = await runDetectionBatch();
  const leads = await recalcLeadsForTenant(session.tenantId);

  return NextResponse.json({ ok: true, detect, leads });
}
