import { recalcLeadsForAllTenants } from "../src/lib/leads";

async function main() {
  const { updated } = await recalcLeadsForAllTenants();
  console.log(`再計算完了: ${updated} 件のリードスコアを更新しました`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
