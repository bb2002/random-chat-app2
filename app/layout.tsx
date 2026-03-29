import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "랜덤 채팅",
  description: "낯선 사람과 7분간 익명으로 대화하세요",
};

// Start matchmaker worker on server side (singleton)
if (typeof window === 'undefined') {
  import('@/lib/matchmaker').then(({ startMatchmakerWorker }) => {
    startMatchmakerWorker();
  }).catch(() => {
    // DB not available during build
  });
}

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
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
