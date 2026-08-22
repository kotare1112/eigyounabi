import ProductForm from "@/components/ProductForm";

export default function OnboardingPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-navy mb-1">STEP1: 自社商品を登録</h1>
      <p className="text-sm text-gray-500 mb-6">
        商品・想定顧客像・解決できる課題を登録すると、検知した企業の変化との自動マッチングが始まります。
      </p>
      <div className="card">
        <ProductForm redirectTo="/dashboard" submitLabel="登録して始める" />
      </div>
    </div>
  );
}
