import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nguyen Minh An — DevOps Engineer",
  description:
    "Terminal-style interactive CV. Type 'help' to explore my experience with Kubernetes, GCP, CI/CD, and cloud infrastructure.",
  keywords: [
    "DevOps Engineer",
    "Kubernetes",
    "GCP",
    "CI/CD",
    "Nguyen Minh An",
  ],
  authors: [{ name: "Nguyen Minh An" }],
  openGraph: {
    title: "Nguyen Minh An — DevOps Engineer",
    description: "Interactive terminal CV — type commands to explore.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full`}>
      <body className="h-full overflow-hidden font-[family-name:var(--font-mono)]">
        {children}
      </body>
    </html>
  );
}
