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

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません。" }, { status: 400 });
  }
  const data = parsed.data;

  const product = await prisma.product.create({
    data: {
      tenantId: session.tenantId,
      name: data.name,
      category: data.category,
      targetProfile: data.targetProfile,
      targetIndustries: data.targetIndustries || null,
      targetEmployeeMin: data.targetEmployeeMin ?? null,
      targetEmployeeMax: data.targetEmployeeMax ?? null,
      referenceCases: data.referenceCases || null,
      priceRangeMin: data.priceRangeMin ?? null,
      priceRangeMax: data.priceRangeMax ?? null,
      tags: {
        create: await resolveTagIds(data.tagCodes),
      },
    },
  });

  await recalcLeadsForTenant(session.tenantId);

  return NextResponse.json({ ok: true, id: product.id });
}

async function resolveTagIds(codes: string[]) {
  if (codes.length === 0) return [];
  const tags = await prisma.tag.findMany({ where: { code: { in: codes } } });
  return tags.map((t) => ({ tagId: t.id }));
}
