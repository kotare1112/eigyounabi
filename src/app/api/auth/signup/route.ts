import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

const schema = z.object({
  companyName: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "パスワードは8文字以上にしてください。"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません。" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "このメールアドレスは既に登録されています。" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const tenant = await prisma.tenant.create({
    data: { name: parsed.data.companyName },
  });

  // 法人の最初のユーザーはマネージャー権限で登録する。
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "MANAGER",
    },
  });

  await setSessionCookie({ userId: user.id, tenantId: user.tenantId, role: user.role });

  return NextResponse.json({ ok: true });
}
