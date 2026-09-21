import type { Metadata } from "next";
import { HomeView } from "@/components/home";
import { getHome } from "@/services/music";
import type { HomeData } from "@/types/music";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mpfy — Your Clean Music Experience",
  description:
    "Discover trending songs, new albums and curated playlists in a clean, distraction-free music experience.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  let home: HomeData | null = null;
  try {
    home = await getHome();
  } catch {
    home = null;
  }
  return <HomeView home={home} />;
}
