import { runDetectionBatch } from "../src/lib/detection";
import { recalcLeadsForAllTenants } from "../src/lib/leads";

async function main() {
  console.log("STEP2: 企業の変化を検知しています...");
  const detectResult = await runDetectionBatch();
  console.log(
    `検知完了: 新規イベント ${detectResult.created} 件（重複スキップ ${detectResult.skippedDuplicates} 件）`
  );

  console.log("STEP3/4: 優先順位と提案を再計算しています...");
  const leadResult = await recalcLeadsForAllTenants();
  console.log(`再計算完了: ${leadResult.updated} 件のリードスコアを更新しました`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
