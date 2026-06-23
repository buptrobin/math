import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "函数定义域闯关教练",
  description: "高中数学函数基础学习 MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
