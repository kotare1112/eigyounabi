import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ISSUE_TAGS } from "../src/lib/tags";
import { runDetectionBatch } from "../src/lib/detection";
import { recalcLeadsForAllTenants } from "../src/lib/leads";

const prisma = new PrismaClient();

const DEMO_COMPANIES = [
  { name: "北陸精機株式会社", industry: "製造業", employeeCount: 180, prefecture: "石川県", capitalManYen: 8000 },
  { name: "サンライズ物流株式会社", industry: "物流業", employeeCount: 320, prefecture: "大阪府", capitalManYen: 5000 },
  { name: "みらいフーズ株式会社", industry: "食品製造業", employeeCount: 95, prefecture: "愛知県", capitalManYen: 3000 },
  { name: "東海鋳造工業株式会社", industry: "製造業", employeeCount: 260, prefecture: "静岡県", capitalManYen: 12000 },
  { name: "グリーンテック株式会社", industry: "IT・ソフトウェア", employeeCount: 60, prefecture: "東京都", capitalManYen: 9000 },
  { name: "北海道アグリ株式会社", industry: "農業関連", employeeCount: 40, prefecture: "北海道", capitalManYen: 1500 },
  { name: "中央電子工業株式会社", industry: "製造業", employeeCount: 410, prefecture: "神奈川県", capitalManYen: 20000 },
  { name: "スカイライン建設株式会社", industry: "建設業", employeeCount: 150, prefecture: "福岡県", capitalManYen: 6000 },
  { name: "エバーグリーン倉庫株式会社", industry: "物流業", employeeCount: 88, prefecture: "埼玉県", capitalManYen: 4000 },
  { name: "第一メディカル機器株式会社", industry: "医療機器製造業", employeeCount: 130, prefecture: "京都府", capitalManYen: 7000 },
  { name: "テクノフォージ株式会社", industry: "製造業", employeeCount: 75, prefecture: "岐阜県", capitalManYen: 2500 },
  { name: "ネクストキャリア株式会社", industry: "人材サービス業", employeeCount: 55, prefecture: "東京都", capitalManYen: 3000 },
];

async function main() {
  console.log("Tagを作成しています...");
  for (const tag of ISSUE_TAGS) {
    await prisma.tag.upsert({
      where: { code: tag.code },
      update: { label: tag.label },
      create: tag,
    });
  }

  console.log("デモ企業テナントを作成しています...");
  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant" },
    update: {},
    create: { id: "demo-tenant", name: "デモ株式会社" },
  });

  const managerPassword = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "山田 マネージャー",
      email: "manager@example.com",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });

  const salesPassword = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "sales@example.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "佐藤 営業",
      email: "sales@example.com",
      passwordHash: salesPassword,
      role: "SALES",
    },
  });

  console.log("サンプル商品を作成しています...");
  const equipmentTagCodes = ["AGING_EQUIPMENT", "CAPACITY_SHORTAGE", "CAPITAL_INVESTMENT_NEEDS"];
  const hrTagCodes = ["LABOR_SHORTAGE", "RECRUITMENT_COST"];

  const existingProduct = await prisma.product.findFirst({
    where: { tenantId: tenant.id, name: "スマート生産設備リース" },
  });
  if (!existingProduct) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "スマート生産設備リース",
        category: "製造機器",
        targetProfile: "製造業、従業員50名以上の工場を持つ企業",
        targetIndustries: "製造業,食品製造業,医療機器製造業",
        targetEmployeeMin: 50,
        targetEmployeeMax: 1000,
        referenceCases: "自動車部品メーカーへの導入実績あり。設備更新と生産能力増強を同時に実現。",
        priceRangeMin: 500000,
        priceRangeMax: 3000000,
        priority: 1,
        tags: {
          create: await Promise.all(
            equipmentTagCodes.map(async (code) => {
              const tag = await prisma.tag.findUniqueOrThrow({ where: { code } });
              return { tagId: tag.id };
            })
          ),
        },
      },
    });
  }

  const existingHrProduct = await prisma.product.findFirst({
    where: { tenantId: tenant.id, name: "採用DXクラウド" },
  });
  if (!existingHrProduct) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "採用DXクラウド",
        category: "人材",
        targetProfile: "採用を強化している企業、従業員数を問わず拠点拡大中の企業",
        targetIndustries: "製造業,物流業,建設業,IT・ソフトウェア",
        referenceCases: "求人媒体の運用を一元化し、採用コストを30%削減した事例あり。",
        priceRangeMin: 100000,
        priceRangeMax: 800000,
        priority: 0,
        tags: {
          create: await Promise.all(
            hrTagCodes.map(async (code) => {
              const tag = await prisma.tag.findUniqueOrThrow({ where: { code } });
              return { tagId: tag.id };
            })
          ),
        },
      },
    });
  }

  console.log("サンプル企業を作成しています...");
  for (const c of DEMO_COMPANIES) {
    const existing = await prisma.company.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.company.create({ data: c });
    }
  }

  console.log("STEP2: 初回の変化検知を実行しています...");
  const detectResult = await runDetectionBatch();
  console.log(`検知: 新規イベント ${detectResult.created} 件`);

  console.log("STEP3/4: リードスコアと提案を計算しています...");
  const leadResult = await recalcLeadsForAllTenants();
  console.log(`リードスコア更新: ${leadResult.updated} 件`);

  console.log("完了しました。");
  console.log("ログイン情報: manager@example.com / password123 (マネージャー)");
  console.log("ログイン情報: sales@example.com / password123 (営業)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
