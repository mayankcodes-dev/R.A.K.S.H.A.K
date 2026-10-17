import type { Metadata } from "next";
import "./globals.css";
import { AnimatedFavicon } from "@/components/ui/RakshakLoader";
import { ScreenFlash } from "@/components/ui/VisualEffects";

export const metadata: Metadata = {
  title: "R.A.K.S.H.A.K. — Counter-UAS Training Simulator",
  description:
    "Real-time Airspace Knowledge System for Hostile Activity Kontainment. Browser-based C-UAS training simulator with physics-based sensor emulation.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/rakshak-logo.jpg",
  },
  openGraph: {
    title: "R.A.K.S.H.A.K. — Counter-UAS Training Simulator",
    description:
      "The next-generation Counter-UAS tactical intelligence platform for the Indian Armed Forces.",
    images: [{ url: "/rakshak-logo.jpg", width: 1024, height: 1024 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="scanlines" suppressHydrationWarning>
        <AnimatedFavicon />
        <ScreenFlash />
        <div className="min-h-screen grid-bg">{children}</div>
      </body>
    </html>
  );
}
