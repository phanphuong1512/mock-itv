import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

const outfit = Outfit({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MockITV - Nền tảng mock phỏng vấn với AI",
  description: "Mock phỏng vấn với AI - luyện đều từng vòng để nâng kỹ năng phỏng vấn mỗi tuần.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
