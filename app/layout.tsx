import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChunkErrorReload } from "@/components/ChunkErrorReload";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

// Runs before hydration so the correct theme class is on <html> before first
// paint - avoids a flash of the wrong theme. Kept as a raw inline script
// (not next/script) because it must execute synchronously, before React
// ever renders.
const THEME_INIT_SCRIPT = `(function(){try{var stored=localStorage.getItem('hera_theme');var dark=stored?stored==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(dark)document.documentElement.classList.add('dark');}catch(e){}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HERA — Estate Management",
  description: "Estate management for residents, landlords, and properties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ChunkErrorReload />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
