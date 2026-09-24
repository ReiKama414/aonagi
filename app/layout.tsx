import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AONAGI 青凪",
  description: "静けさは、まだ生きている — 幽靜藍綠竹林、月夜水庭與小黑貓的沉浸式視覺故事。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500&family=Jost:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
