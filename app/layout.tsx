import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATOTSUGI 跡継ぎ",
  description: "The AI Heir — a bridge from shop owner to successor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
