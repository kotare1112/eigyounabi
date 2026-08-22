import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { recalcLeadsForTenant } from "@/lib/leads";

const schema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  targetProfile: z.string().min(1),
  targetIndustries: z.string().optional().nullable(),
  targetEmployeeMin: z.number().int().nullable().optional(),
  targetEmployeeMax: z.number().int().nullable().optional(),
  referenceCases: z.string().optional().nullable(),
  priceRangeMin: z.number().int().nullable().optional(),
  priceRangeMax: z.number().int().nullable().optional(),
  tagCodes: z.array(z.string()).default([]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "商品が見つかりません。" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません。" }, { status: 400 });
  }
  const data = parsed.data;

  const tags = data.tagCodes.length > 0
    ? await prisma.tag.findMany({ where: { code: { in: data.tagCodes } } })
    : [];

  await prisma.$transaction([
    prisma.productTag.deleteMany({ where: { productId: product.id } }),
    prisma.product.update({
      where: { id: product.id },
      data: {
        name: data.name,
        category: data.category,
        targetProfile: data.targetProfile,
        targetIndustries: data.targetIndustries || null,
        targetEmployeeMin: data.targetEmployeeMin ?? null,
        targetEmployeeMax: data.targetEmployeeMax ?? null,
        referenceCases: data.referenceCases || null,
        priceRangeMin: data.priceRangeMin ?? null,
        priceRangeMax: data.priceRangeMax ?? null,
        tags: { create: tags.map((t) => ({ tagId: t.id })) },
      },
    }),
  ]);

  await recalcLeadsForTenant(session.tenantId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "商品が見つかりません。" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id: product.id } });

  return NextResponse.json({ ok: true });
}
