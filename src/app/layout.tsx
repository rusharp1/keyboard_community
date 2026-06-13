import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://keyboard-community.vercel.app";
const SITE_NAME = "키보드 커뮤니티";
const SITE_DESC =
  "기계식 키보드 축(스위치)·키캡·키보드 도감과 타건음, 다축 별점 리뷰·커뮤니티.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "키보드 커뮤니티 — 축·키캡·키보드 도감 & 타건음",
    template: "%s",
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: ["기계식키보드", "축", "스위치", "키캡", "키보드", "타건음", "도감", "리뷰"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "키보드 커뮤니티 — 축·키캡·키보드 도감 & 타건음",
    description: SITE_DESC,
  },
  twitter: {
    card: "summary",
    title: "키보드 커뮤니티",
    description: SITE_DESC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
