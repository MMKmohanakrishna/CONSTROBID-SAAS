import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import RealtimeSyncProvider from "@/components/RealtimeSyncProvider";
import { LightboxProvider } from "@/context/LightboxContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ConstroBID | Managed Construction & Interior Bidding Marketplace",
  description: "Connect with verified contractors, get inspect-backed designs, compare quotations, and monitor your construction in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <RealtimeSyncProvider>
            <LightboxProvider>{children}</LightboxProvider>
          </RealtimeSyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
