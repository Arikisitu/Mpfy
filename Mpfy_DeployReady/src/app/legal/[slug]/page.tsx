import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MpfyIcon } from "@/components/layout";

export const dynamic = "force-dynamic";

const SLUGS = ["about", "terms", "privacy", "copyright", "third-party"] as const;
type Slug = (typeof SLUGS)[number];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = PAGES[slug as Slug];
  if (!meta) return { title: "Not found" };
  return { title: meta.title, alternates: { canonical: `/legal/${slug}` } };
}

interface PageDef {
  title: string;
  intro: string;
  sections: { h: string; body: string[] }[];
}

const PAGES: Record<Slug, PageDef> = {
  about: {
    title: "About Mpfy",
    intro: "An AI-built music experience.",
    sections: [
      {
        h: "What Mpfy is",
        body: [
          "Mpfy is a clean, distraction-free music discovery and playback experience. It aggregates public music metadata and plays music through YouTube's officially supported embed player — Mpfy never hosts, downloads or re-streams copyrighted audio.",
          "The Mpfy interface itself contains no third-party advertising UI: no banners, popups or sponsored cards. YouTube playback inside the embed may be subject to YouTube's own policies and behavior.",
        ],
      },
      {
        h: "AI disclosure",
        body: [
          "Mpfy was created using AI-assisted development, human direction, and open web technologies. AI tooling assisted in writing code, copy and design; humans directed the product, reviewed the output and remain responsible for it.",
          "No claim is made that AI owns any intellectual property here, and Mpfy is not officially affiliated with YouTube, Apple, Spotify, MetroList or any record label.",
        ],
      },
      {
        h: "Principles",
        body: [
          "Clarity over decoration. Speed over spectacle. Reliability over gimmicks. Every screen exists to get you closer to music you love — nothing else.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    intro: "Please read these terms before using Mpfy.",
    sections: [
      {
        h: "1. Acceptable use",
        body: [
          "You may use Mpfy for personal, non-commercial music discovery and playback. You agree not to misuse the service, interfere with its operation, or use it to violate any applicable law.",
        ],
      },
      {
        h: "2. Prohibited use",
        body: [
          "You must not attempt to download, extract, re-host or re-stream audio through Mpfy; bypass advertisements, DRM or access controls of third-party platforms; scrape the service at scale; or infringe the rights of others.",
        ],
      },
      {
        h: "3. Third-party services",
        body: [
          "Mpfy relies on third-party services such as YouTube for playback and metadata. Those services are governed by their own terms. Mpfy is not responsible for the availability, content or policies of third-party platforms.",
        ],
      },
      {
        h: "4. Accounts",
        body: [
          "You are responsible for keeping your account credentials secure. Guest data is stored locally on your device; synced data is stored on our servers and protected with reasonable technical measures.",
        ],
      },
      {
        h: "5. Intellectual property",
        body: [
          "The Mpfy name, logo and interface are property of Mpfy. Music metadata, artwork and audio remain the property of their respective rights holders. Mpfy claims no ownership of third-party content.",
        ],
      },
      {
        h: "6. Limitation of liability",
        body: [
          "The service is provided “as is”. To the maximum extent permitted by law, Mpfy is not liable for indirect or consequential damages arising from use of the service, including interruptions caused by third-party services.",
        ],
      },
      {
        h: "7. Availability, termination & changes",
        body: [
          "We aim for high availability but do not guarantee uninterrupted service. We may suspend accounts that violate these terms and may update these terms with reasonable notice; continued use after changes constitutes acceptance.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "What we collect, why, and the control you have.",
    sections: [
      {
        h: "Data we collect",
        body: [
          "Account data (name, email, hashed password) when you sign up. Library data (likes, history, playlists) when signed in. For guests, this data stays in your browser's local storage. Anonymous usage analytics only if you enable them in Settings.",
        ],
      },
      {
        h: "How data is used",
        body: [
          "To provide and improve the service: remembering your library, personalizing discovery, and keeping accounts secure. We do not sell personal data and we do not serve third-party advertising.",
        ],
      },
      {
        h: "Cookies & local storage",
        body: [
          "A session cookie keeps you signed in. Local storage holds guest preferences, theme, queue and library. Clearing site data removes all guest information.",
        ],
      },
      {
        h: "Third-party APIs",
        body: [
          "Search and metadata may be fetched from the YouTube Data API using our server-side key; your queries are not shared with third parties beyond what is required to fulfill them. Playback occurs in YouTube's embed, which is governed by Google's privacy policy.",
        ],
      },
      {
        h: "Retention & deletion",
        body: [
          "History is capped at 100 entries and can be cleared at any time. You can delete local data from Settings. To delete your account and all synced data, contact privacy@mpfy.example — requests are honored within 30 days.",
        ],
      },
      {
        h: "Your rights",
        body: [
          "You may access, correct, export or delete your data. Contact privacy@mpfy.example for any privacy question.",
        ],
      },
    ],
  },
  copyright: {
    title: "Copyright / DMCA",
    intro: "Respect for rights holders is fundamental to Mpfy.",
    sections: [
      {
        h: "No ownership of third-party music",
        body: [
          "Mpfy does not claim ownership of any third-party music, artwork or metadata. All such content remains the property of its respective rights holders.",
        ],
      },
      {
        h: "Playback via third-party platforms",
        body: [
          "Playback may rely on third-party platforms such as YouTube via their official embed mechanisms. Mpfy does not host, download, extract or re-stream audio. If a rights holder has disabled embedding for a work, Mpfy cannot and will not play it.",
        ],
      },
      {
        h: "Infringement notices",
        body: [
          "If you believe content surfaced by Mpfy infringes your copyright, send a notice to copyright@mpfy.example with: identification of the work, the location (URL / video id), your contact details, and a good-faith statement of authorization. We respond to valid notices promptly, including disabling links and embedding references where appropriate.",
        ],
      },
      {
        h: "Repeat policy",
        body: [
          "References to content subject to valid infringement notices are removed, and references from repeat infringing sources are blocked.",
        ],
      },
    ],
  },
  "third-party": {
    title: "Third-Party Services",
    intro: "Mpfy is built with help from the following services.",
    sections: [
      {
        h: "YouTube / YouTube Data API",
        body: [
          "Metadata, search results and playback are provided through YouTube's official Data API v3 and IFrame embed player, used in accordance with YouTube's Terms of Service. YouTube is a service of Google LLC. Mpfy is not endorsed by or affiliated with YouTube.",
        ],
      },
      {
        h: "Infrastructure",
        body: [
          "Mpfy runs on open-source web technologies (Next.js, React, PostgreSQL, Drizzle ORM) and standard cloud hosting. Authentication is handled in-house with salted, hashed passwords and signed session tokens.",
        ],
      },
      {
        h: "Analytics",
        body: [
          "Analytics are disabled by default. If enabled, only anonymous, aggregated usage events are collected — never your listening history for advertising purposes.",
        ],
      },
      {
        h: "No endorsement",
        body: [
          "References to Apple Music, Spotify, YouTube Music or MetroList describe design inspiration only. Mpfy is an independent product and is not endorsed by, sponsored by, or affiliated with any of these companies.",
        ],
      },
    ],
  },
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug as Slug];
  if (!page) notFound();
  return (
    <div className="fade-up mx-auto max-w-3xl px-4 pt-8 md:px-6">
      <div className="mb-6 flex items-center gap-3">
        <MpfyIcon className="h-9 w-9" />
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{page.title}</h1>
          <p className="text-sm text-[var(--text-dim)]">{page.intro}</p>
        </div>
      </div>
      <p className="mb-6 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
        Template notice: these pages are provided as a starting point and should be reviewed for the
        actual business, jurisdiction and services in use before production launch.
      </p>
      <div className="space-y-6">
        {page.sections.map((s) => (
          <section key={s.h} className="card p-5">
            <h2 className="font-display mb-2 text-base font-bold">{s.h}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3 pb-10 text-xs text-[var(--text-faint)]">
        {SLUGS.filter((s) => s !== slug).map((s) => (
          <Link key={s} href={`/legal/${s}`} className="underline-offset-2 hover:underline">
            {PAGES[s].title}
          </Link>
        ))}
      </div>
    </div>
  );
}
