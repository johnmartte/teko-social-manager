import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { AuthProvider } from "@/context/AuthContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Teko Social Manager",
  description: "Gestiona tus cuentas de Instagram y Facebook desde un solo lugar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex teko-shell">
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
            <Header />
            <main className="flex-1 px-5 py-5 sm:px-8 sm:py-7">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
