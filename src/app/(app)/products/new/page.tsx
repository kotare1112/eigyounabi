import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-navy mb-6">商品を登録</h1>
      <div className="card">
        <ProductForm />
      </div>
    </div>
  );
}
