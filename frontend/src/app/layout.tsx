import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-cairo",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1a9d65",
};

export const metadata: Metadata = {
  title: {
    default: "حصاد الذكي — Smart Hasaad",
    template: "%s | حصاد الذكي",
  },
  description:
    "سوق زراعي ذكي يربط المزارعين الفلسطينيين بالمستهلكين مباشرةً — منتجات طازجة بأسعار عادلة وتوصيل موثوق",
  keywords: ["سوق زراعي", "منتجات طازجة", "مزارعين", "فلسطين", "حصاد"],
  authors: [{ name: "Smart Hasaad Team" }],
  manifest: "/manifest.json",
  formatDetection: { telephone: false },
  openGraph: {
    title: "حصاد الذكي — Smart Hasaad",
    description: "سوق زراعي ذكي — منتجات طازجة مباشرة من المزارع",
    locale: "ar_PS",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} scroll-smooth`}>
      <body className="font-arabic antialiased bg-surface-warm text-stone-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
