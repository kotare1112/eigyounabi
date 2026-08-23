import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DesiredProductsManager from "@/components/PreferredProductsForm";

export default async function DesiredProductsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const desiredProducts = await prisma.desiredProduct.findMany({
    where: { tenantId: session.tenantId },
    include: { createdByUser: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">希望する商品</h1>
        <p className="text-sm text-slate-500 mt-1">
          自社が導入したいサービス・欲しい商品を登録しておきましょう。
        </p>
      </div>

      <DesiredProductsManager
        initialItems={desiredProducts.map((d) => ({
          id: d.id,
          name: d.name,
          memo: d.memo,
          createdByUserName: d.createdByUser?.name ?? null,
        }))}
      />
    </div>
  );
}
