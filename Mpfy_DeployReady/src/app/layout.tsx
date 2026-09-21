import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Shell } from "@/components/layout";
import { curatedPlaylistsMeta } from "@/services/music";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://mpfy.example"),
  title: {
    default: "Mpfy — Your Clean Music Experience",
    template: "%s · Mpfy",
  },
  description:
    "Mpfy is an AI-built music discovery and playback experience: clean, fast, distraction-free. Search songs, build playlists and enjoy — powered by YouTube's official embed player.",
  applicationName: "Mpfy",
  keywords: ["music", "player", "playlists", "discovery", "mpfy"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icons/icon-512.png",
  },
  openGraph: {
    title: "Mpfy — Your Clean Music Experience",
    description:
      "Clean, fast, distraction-free music discovery and playback. Built with AI-assisted development.",
    siteName: "Mpfy",
    type: "website",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Mpfy" }],
  },
  twitter: {
    card: "summary",
    title: "Mpfy — Your Clean Music Experience",
    description: "Clean, fast, distraction-free music discovery and playback.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let curated: ReturnType<typeof curatedPlaylistsMeta> = [];
  try {
    curated = curatedPlaylistsMeta();
  } catch {
    curated = [];
  }
  return (
    <html lang="en" data-ui="apple" data-surface="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.youtube.com" />
      </head>
      <body>
        <Shell curated={curated}>{children}</Shell>
      </body>
    </html>
  );
}
