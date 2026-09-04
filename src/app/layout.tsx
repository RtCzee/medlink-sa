import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import SessionProvider from "@/components/session-provider";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/lang-context";
import { SecurityProvider } from "@/components/security-provider";
import ChunkErrorHandler from "@/components/chunk-error-handler";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedLink SA — South Africa's National Health Network",
  description:
    "MedLink SA connects patients, doctors, hospitals, pharmacies and administrators into one national digital health ecosystem. Book appointments, order medicine, join the queue, and get care — anywhere in South Africa.",
  keywords: [
    "MedLink SA",
    "digital health South Africa",
    "telemedicine",
    "healthcare platform",
    "online pharmacy South Africa",
    "clinic queue",
    "DHIS2",
  ],
  authors: [{ name: "MedLink SA" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "MedLink SA — South Africa's National Health Network",
    description:
      "One operating system for South African healthcare. Patients, doctors, hospitals, pharmacies & administrators — connected.",
    siteName: "MedLink SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MedLink SA",
    description:
      "South Africa's national digital health ecosystem — one living nervous system.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#05070d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrains.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
        <SessionProvider>
          <AuthProvider>
            <LanguageProvider>
              <SecurityProvider>
                <ChunkErrorHandler />
                {children}
              </SecurityProvider>
            </LanguageProvider>
          </AuthProvider>
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
