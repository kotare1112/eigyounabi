export const ACTION_TYPE_LABEL: Record<string, string> = {
  CALL: "架電",
  EMAIL: "メール",
  MEETING: "商談",
  NOTE: "メモ",
};

// アクション記録時に選択する結果ラベル。STEP3のスコアリング（過去の商談履歴）
// および LeadStatus の更新に利用する。
export const RESULT_OPTIONS = [
  "反応なし",
  "商談化",
  "受注",
  "失注・NG",
  "再アプローチ予定",
] as const;

export type ResultOption = (typeof RESULT_OPTIONS)[number];

export function statusFromResult(result: string | null | undefined):
  | "CONTACTED"
  | "IN_PROGRESS"
  | "WON"
  | "LOST"
  | null {
  switch (result) {
    case "受注":
      return "WON";
    case "失注・NG":
      return "LOST";
    case "商談化":
    case "再アプローチ予定":
      return "IN_PROGRESS";
    case "反応なし":
      return "CONTACTED";
    default:
      return null;
  }
}
