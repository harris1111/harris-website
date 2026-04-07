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
  url: "https://example.com", // Replace with actual domain
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
