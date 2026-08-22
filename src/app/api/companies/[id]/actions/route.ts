import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { statusFromResult } from "@/lib/actionResults";

const schema = z.object({
  leadScoreId: z.string().nullable().optional(),
  actionType: z.enum(["CALL", "EMAIL", "MEETING", "NOTE"]),
  result: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { id: params.id } });
  if (!company) return NextResponse.json({ error: "企業が見つかりません。" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません。" }, { status: 400 });
  }
  const data = parsed.data;

  await prisma.action.create({
    data: {
      tenantId: session.tenantId,
      companyId: company.id,
      leadScoreId: data.leadScoreId || null,
      userId: session.userId,
      actionType: data.actionType,
      result: data.result || null,
      note: data.note || null,
    },
  });

  if (data.leadScoreId) {
    const newStatus = statusFromResult(data.result);
    if (newStatus) {
      await prisma.leadScore.update({
        where: { id: data.leadScoreId },
        data: { status: newStatus },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
