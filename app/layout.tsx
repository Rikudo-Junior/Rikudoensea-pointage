import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pointage stagiaires — ENSEA",
  description: "Suivi des heures d'arrivée et de départ des stagiaires de l'ENSEA.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pointage ENSEA",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
