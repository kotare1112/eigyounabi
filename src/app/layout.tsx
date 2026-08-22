import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "営業ナビ",
  description: "会社を検索する営業から、売れる兆しが届く営業へ。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
