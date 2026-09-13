import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Caveat, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

import { TravelJournalBackground } from "@/components/ui/TravelJournalBackground";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#162738",
};

export const metadata: Metadata = {
  title: "Nuestras Aventuras",
  description:
    "Diario de viajes, cartas de amor y momentos especiales de Samuel y Diana.",
  icons: {
    icon: "/NuestrasAventurasLG.png",
    apple: "/NuestrasAventurasLG.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable} ${ibmPlexMono.variable}`}
    >
      <body className="font-sans antialiased min-h-screen selection:bg-sky-pastel selection:text-ocean-ink relative">
        <TravelJournalBackground />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
