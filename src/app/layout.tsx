import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Planesito de Vida — Citas de Amor",
  description:
    "Cartas de amor e invitaciones íntimas para agendar los momentos más lindos juntos.",
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
      <body className="font-sans antialiased min-h-screen selection:bg-sky-pastel selection:text-ocean-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
