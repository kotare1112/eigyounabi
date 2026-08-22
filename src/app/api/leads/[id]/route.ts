import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

const schema = z.object({
  assignedUserId: z.string().nullable().optional(),
  status: z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "WON", "LOST", "EXCLUDED"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });

  const lead = await prisma.leadScore.findUnique({ where: { id: params.id } });
  if (!lead || lead.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "リードが見つかりません。" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません。" }, { status: 400 });
  }

  if (parsed.data.assignedUserId !== undefined && session.role === "SALES") {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  await prisma.leadScore.update({
    where: { id: lead.id },
    data: {
      ...(parsed.data.assignedUserId !== undefined ? { assignedUserId: parsed.data.assignedUserId } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
