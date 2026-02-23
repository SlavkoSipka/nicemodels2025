import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/layout/ScrollToTop";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "NiceModels.ch - Das Erotikportal",
  description: "Premium escort service in Switzerland",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={playfair.variable}>
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
