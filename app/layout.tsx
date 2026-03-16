import type { Metadata, Viewport } from "next";
import { Montserrat, Manrope } from "next/font/google";
import "./globals.css";
import Providers from '@/components/Providers';
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const APP_NAME = "Mental Pulse";
const APP_DEFAULT_TITLE = "Mental Pulse";
const APP_TITLE_TEMPLATE = "%s - Mental Pulse";
const APP_DESCRIPTION = "Best Mental Health app in the world!";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: "Mental Pulse",
  description: "Mental Pulse - Your Mental Health Companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className={`${montserrat.variable} ${manrope.variable} antialiased font-sans bg-background-light dark:bg-background-dark text-text-main dark:text-slate-100 flex flex-col min-h-screen`}>
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}