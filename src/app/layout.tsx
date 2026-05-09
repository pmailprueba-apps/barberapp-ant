import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, DM_Mono } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import { FCMProvider } from "@/components/fcm-provider";
import { DevTools } from "@/components/dev-tools";
import { Toaster } from "sonner";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  weight: "400",
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BarberApp — Sistema de Gestión para Barberías",
  description: "Plataforma SaaS multi-tenant para gestionar barberías en San Luis Potosí",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BarberApp",
  },
  icons: {
    icon: [{ url: "/icons/icon-192x192.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192x192.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-[var(--dark)] text-[var(--white)] antialiased">
        <AuthProvider>
          <FCMProvider>
            {children}
            <Toaster position="top-right" richColors theme="dark" />
            <DevTools />
          </FCMProvider>
        </AuthProvider>
      </body>
    </html>
  );
}