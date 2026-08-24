import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { recalcLeadsForTenant } from "@/lib/leads";

const schema = z.object({
  tagCodes: z.array(z.string()).default([]),
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

  const tags = await prisma.tag.findMany({ where: { code: { in: parsed.data.tagCodes } } });

  await prisma.$transaction([
    prisma.companyNeedTag.deleteMany({ where: { companyId: company.id } }),
    prisma.companyNeedTag.createMany({
      data: tags.map((tag) => ({ companyId: company.id, tagId: tag.id })),
    }),
  ]);

  await recalcLeadsForTenant(session.tenantId);

  return NextResponse.json({ ok: true });
}
