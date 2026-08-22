# 営業ナビ

企業に起きた変化（設備投資・採用拡大・資金調達など）を検知し、営業すべき理由と提案内容を毎朝届ける営業支援 SaaS。
仕様は [docs/spec.md](docs/spec.md) を参照。

## セットアップ

```bash
npm install
cp .env.example .env   # SESSION_SECRET を任意の文字列に変更
npm run db:push        # SQLite にスキーマを反映
npm run db:seed         # デモ用テナント・商品・企業データを投入
npm run dev
```

http://localhost:3000 を開き、以下のデモアカウントでログインできます。

| ロール | メールアドレス | パスワード |
|---|---|---|
| マネージャー | manager@example.com | password123 |
| 営業担当者 | sales@example.com | password123 |

## 実装済み機能（仕様書の4ステップ）

1. **商品登録** (`/products`, `/onboarding`) — 商品・想定顧客像・解決できる課題タグを登録
2. **企業の変化検知** (`src/lib/detection.ts`) — 外部データソース（ニュース/IR/求人媒体）を抽象化した
   `DetectionSource` インターフェース。実APIが無い現状はシミュレーション実装で疑似イベントを生成
3. **営業先の優先順位化** (`src/lib/scoring.ts`) — 新鮮度30%・商品マッチ度40%・企業属性20%・商談履歴10%の
   重み付けでスコアを算出（ダッシュボードに反映）
4. **次の行動を提案** (`src/lib/proposal.ts`) — 検知イベントと商品情報からトークスクリプト・提案骨子・
   メール文面のドラフトを生成（営業担当者が編集可能）

マネージャーはダッシュボードから「今すぐ変化を検知する」を実行することで、本来は日次バッチで動かす
STEP2〜4のパイプラインを手動実行できます（CLIでも `npm run detect:run` で同等の処理を実行可能）。

## 今後実装が必要な部分

- 実際のニュース/求人/IR APIとの連携（現在はシミュレーションデータ）
- 日次メール配信・Slack/Teams通知
- 決済・請求（Stripe等）との連携
- 生成AI(LLM)による提案文生成への差し替え（現在はテンプレートベース）

詳細は [docs/spec.md](docs/spec.md) の「今後の検討事項」を参照。
