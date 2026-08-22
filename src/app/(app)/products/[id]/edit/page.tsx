import { notFound } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return null;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  });
  if (!product || product.tenantId !== session.tenantId) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-navy mb-6">商品を編集</h1>
      <div className="card">
        <ProductForm
          submitLabel="更新する"
          initialValues={{
            id: product.id,
            name: product.name,
            category: product.category,
            targetProfile: product.targetProfile,
            targetIndustries: product.targetIndustries ?? "",
            targetEmployeeMin: product.targetEmployeeMin?.toString() ?? "",
            targetEmployeeMax: product.targetEmployeeMax?.toString() ?? "",
            referenceCases: product.referenceCases ?? "",
            priceRangeMin: product.priceRangeMin?.toString() ?? "",
            priceRangeMax: product.priceRangeMax?.toString() ?? "",
            tagCodes: product.tags.map((t) => t.tag.code),
          }}
        />
      </div>
    </div>
  );
}
