import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

const schema = z.object({
  openingLine: z.string().min(1),
  proposalSummary: z.string().min(1),
  emailDraft: z.string().min(1),
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

  await prisma.proposal.upsert({
    where: { leadScoreId: lead.id },
    create: { leadScoreId: lead.id, ...parsed.data, editedByUser: true },
    update: { ...parsed.data, editedByUser: true },
  });

  return NextResponse.json({ ok: true });
}
