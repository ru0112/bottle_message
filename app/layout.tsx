import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "漂流瓶 | 海へ流す、誰かから届く",
  description: "言葉を海へ流して、どこかの誰かから届く手紙を受け取ろう。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
