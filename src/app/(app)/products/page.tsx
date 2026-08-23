import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ISSUE_TAGS } from "@/lib/tags";
import DeleteProductButton from "@/components/DeleteProductButton";

export default async function ProductsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const products = await prisma.product.findMany({
    where: { tenantId: session.tenantId },
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-navy">自社製品</h1>
          <p className="text-sm text-gray-500">
            STEP1: 商品・想定顧客像・解決できる課題を登録します。
          </p>
        </div>
        <Link href="/products/new" className="btn-primary">
          + 商品を登録
        </Link>
      </div>

      {products.length === 0 && (
        <div className="card text-sm text-gray-500">
          まだ商品が登録されていません。「商品を登録」から最初の商品を追加してください。
        </div>
      )}

      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.id} className="card flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-navy">{p.name}</h2>
                <span className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-600">
                  {p.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{p.targetProfile}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {p.tags.map((pt) => (
                  <span
                    key={pt.tagId}
                    className="text-xs bg-teal/10 text-teal border border-teal rounded-full px-2 py-0.5"
                  >
                    {ISSUE_TAGS.find((t) => t.code === pt.tag.code)?.label ?? pt.tag.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/products/${p.id}/edit`} className="btn-secondary text-sm">
                編集
              </Link>
              <DeleteProductButton productId={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
