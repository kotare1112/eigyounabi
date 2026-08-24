import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { generateSimulatedReply } from "@/lib/messageSimulation";

const schema = z.object({
  companyId: z.string().min(1),
  leadScoreId: z.string().nullable().optional(),
  body: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません。" }, { status: 400 });
  }
  const { companyId, leadScoreId, body } = parsed.data;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return NextResponse.json({ error: "企業が見つかりません。" }, { status: 404 });

  const leadScore = leadScoreId
    ? await prisma.leadScore.findFirst({
        where: { id: leadScoreId, tenantId: session.tenantId, companyId },
        include: { product: true },
      })
    : null;

  const salesMessage = await prisma.message.create({
    data: {
      tenantId: session.tenantId,
      companyId,
      leadScoreId: leadScore?.id ?? null,
      sender: "SALES",
      senderUserId: session.userId,
      body,
    },
  });

  const companyReply = await prisma.message.create({
    data: {
      tenantId: session.tenantId,
      companyId,
      leadScoreId: leadScore?.id ?? null,
      sender: "COMPANY",
      body: generateSimulatedReply(company, leadScore?.product ?? null),
    },
  });

  return NextResponse.json({ ok: true, salesMessage, companyReply });
}
