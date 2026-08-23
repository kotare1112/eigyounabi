import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, memo }: { name: string; memo?: string } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const desiredProduct = await prisma.desiredProduct.create({
    data: {
      tenantId: session.tenantId,
      name: name.trim(),
      memo: memo?.trim() || null,
      createdByUserId: session.userId,
    },
  });

  return NextResponse.json({ ok: true, desiredProduct });
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }: { id: string } = await req.json();

  await prisma.desiredProduct.deleteMany({
    where: { id, tenantId: session.tenantId },
  });

  return NextResponse.json({ ok: true });
}
