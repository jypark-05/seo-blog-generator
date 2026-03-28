import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "SEO 블로그 생성기",
  description: "SEO 최적화된 블로그 콘텐츠를 자동으로 생성하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} min-h-screen text-[#f5f5f7] bg-black flex flex-col selection:bg-[#3182f6] selection:text-white`}>
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
              SEO Blog
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">새 글 작성</Link>
              <Link href="/settings" className="flex items-center gap-2 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/10">
                ⚙️ 가이드 설정
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1 flex flex-col relative w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
