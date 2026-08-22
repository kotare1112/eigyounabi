import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userCount = await prisma.user.count({ where: { tenantId: user.tenantId } });
  const productCount = await prisma.product.count({ where: { tenantId: user.tenantId } });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-navy">設定</h1>
        <p className="text-sm text-gray-500">契約情報・通知設定・外部連携を管理します。</p>
      </div>

      <div className="card">
        <h2 className="font-bold text-navy mb-3">契約情報</h2>
        <dl className="text-sm grid grid-cols-2 gap-y-2">
          <dt className="text-gray-500">法人名</dt>
          <dd>{user.tenant.name}</dd>
          <dt className="text-gray-500">プラン</dt>
          <dd>スタンダード（月額29,800円）</dd>
          <dt className="text-gray-500">登録ユーザー数</dt>
          <dd>{userCount}名</dd>
          <dt className="text-gray-500">登録商品数</dt>
          <dd>{productCount}件</dd>
        </dl>
      </div>

      <div className="card">
        <h2 className="font-bold text-navy mb-3">日次レポート配信設定</h2>
        <p className="text-sm text-gray-600 mb-3">
          毎営業日の朝、ダッシュボードに「明日電話すべき5社」が更新されます。
        </p>
        <div className="text-sm">
          <label className="label">配信時刻</label>
          <select className="input max-w-xs" defaultValue="08:00" disabled>
            <option value="08:00">08:00 JST</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            現バージョンではダッシュボード上での即時確認のみ対応しています。メール配信は今後対応予定です。
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-navy mb-3">外部連携（今後対応予定）</h2>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>・Slack / Teams 通知連携</li>
          <li>・ニュース・IR・求人媒体APIとの実データ連携（現在はシミュレーションデータ）</li>
          <li>・SFA/CRM（Salesforceなど）との連携</li>
        </ul>
      </div>
    </div>
  );
}
