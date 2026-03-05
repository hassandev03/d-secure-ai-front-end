import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "D-SecureAI — Privacy-Preserving AI Gateway",
  description:
    "Use ChatGPT, Claude & Gemini without exposing your data. D-SecureAI automatically detects and anonymizes sensitive information before it reaches any AI provider.",
  keywords: [
    "AI privacy",
    "data anonymization",
    "ChatGPT",
    "Claude",
    "Gemini",
    "enterprise AI",
    "secure AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={5000}
        />
      </body>
    </html>
  );
}
