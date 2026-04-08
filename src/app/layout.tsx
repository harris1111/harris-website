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
    "Cloud Engineer",
    "Docker",
    "ArgoCD",
    "GitHub Actions",
  ],
  authors: [{ name: "Nguyen Minh An" }],
  openGraph: {
    title: "Nguyen Minh An — DevOps Engineer",
    description:
      "Interactive terminal CV — type commands to explore 2.5+ years of DevOps experience.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nguyen Minh An — DevOps Engineer",
    description: "Interactive terminal CV — type commands to explore.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** JSON-LD Person structured data */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Nguyen Minh An",
  jobTitle: "DevOps Engineer",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://cv.minhan.dev",
  email: "minhan112001@gmail.com",
  telephone: "+84347802611",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ho Chi Minh City",
    addressCountry: "VN",
  },
  sameAs: [
    "https://linkedin.com/in/minh-an-nguyen-453b39222",
    "https://github.com/harris1111",
  ],
  knowsAbout: [
    "Kubernetes",
    "Docker",
    "GCP",
    "AWS",
    "CI/CD",
    "GitOps",
    "ArgoCD",
    "Prometheus",
    "Grafana",
  ],
  alumniOf: {
    "@type": "EducationalOrganization",
    name: "Ho Chi Minh City University of Science",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen font-[family-name:var(--font-mono)]">
        {/* Console easter egg for devtools users */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log(
                "%c  _  _ ___ ___ ___   __  __ ___ %c\\n" +
                "%c | || |_ _| _ \\\\ __| |  \\\\/  | __|%c\\n" +
                "%c | __ || ||   / _|  | |\\\\/| | _| %c\\n" +
                "%c |_||_|___|_|_\\\\___| |_|  |_|___|%c\\n",
                "color:#05d9e8;font-size:14px;font-weight:bold;","",
                "color:#05d9e8;font-size:14px;font-weight:bold;","",
                "color:#05d9e8;font-size:14px;font-weight:bold;","",
                "color:#05d9e8;font-size:14px;font-weight:bold;",""
              );
              console.log(
                "%cYou opened devtools. You're my kind of person.%c\\n\\n" +
                "%cThis is not the terminal you're looking for.%c\\n" +
                "%cClose devtools, click the page, and type commands there.%c\\n\\n" +
                "%cStart with: ls -la%c\\n" +
                "%cOr go straight to: sudo hire-me%c",
                "color:#ff2a6d;font-size:13px;font-weight:bold;","",
                "color:#f5a623;font-size:12px;","",
                "color:#f5a623;font-size:12px;","",
                "color:#01c38d;font-size:12px;font-weight:bold;","",
                "color:#01c38d;font-size:12px;font-weight:bold;",""
              );
            `,
          }}
        />
        {/* Hidden semantic HTML for screen readers and crawlers */}
        <div className="sr-only" aria-hidden="false">
          <h1>Nguyen Minh An — DevOps Engineer</h1>
          <p>
            DevOps Engineer with 2.5+ years experience in Kubernetes, GCP, AWS,
            CI/CD, and cloud infrastructure. Based in Ho Chi Minh City, Vietnam.
          </p>
        </div>
        {children}
      </body>
    </html>
  );
}
