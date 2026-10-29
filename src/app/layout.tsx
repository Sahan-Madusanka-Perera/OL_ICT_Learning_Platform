import type { Metadata, Viewport } from 'next';
import { Lexend, JetBrains_Mono } from 'next/font/google';
import './globals.css';

/**
 * Two voices.
 *
 * LEXEND carries everything a student reads — headings, interface and the
 * questions themselves. It was drawn to reduce visual stress and improve
 * reading fluency, which is the job on a screen a tired fifteen-year-old
 * reads for forty minutes; at display sizes and light weights it is also the
 * airy geometric the whole daylight look rests on. One variable file covers
 * every weight from the 300 page titles to the 600 emphasis.
 *
 * JETBRAINS MONO is for data, and in this subject data is half the syllabus:
 * `1110 1110₂`, `=IF(B2>=50,"Pass","Fail")`, `<td rowspan=2>`, Pascal. Setting
 * those in a proportional face is how a transcription error becomes invisible.
 *
 * Both are self-hosted by next/font — no request to a font CDN. One fewer
 * round trip on a slow connection, and one fewer third party that learns which
 * students are studying at 11pm.
 */
const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'O/L ICT Practice',
    template: '%s · O/L ICT Practice',
  },
  description:
    'Practice for the Sri Lankan G.C.E. Ordinary Level ICT examination. Past papers, model questions, worked explanations and honest progress tracking.',
  robots: { index: true, follow: true },
};

/*
 * The design direction, emitted as an HTML comment so it survives the build and
 * can be audited against the rendered page. See DESIGN.md for the full system.
 */
const DIRECTION_CONTRACT = `<!--
THESIS: Honest practice in a room that feels good to sit in. Refuses the paper-and-serif exam sheet and the dense SaaS grid for airy frosted sheets floating in daylight.
OWN-WORLD: Fixed peach/sky/lavender wash; milk-glass 28px sheets with lit rims; ink-black pills as the only accent; lilac/sky/mint tiles carrying their own ink; Lexend light display; violet/teal data in striped areas. Night: aurora over indigo, chalk-white pills.
STORY: The student reads a big light greeting, sees one black pill to press, their to-fix list, weak topics as pastel tiles and the week drawn as striped areas, and trusts it because no percentage appears without evidence.
FIRST VIEWPORT: Desktop: chip logo tile top-left, centred pill tabs with the black active pill, streak and avatar right, floating icon rail left; 56px light title; raised recommendation sheet left with lilac panel and black CTA; striped week chart right. Phone: title, recommendation, floating bottom pill nav.
FORM: User-pinned reference (daylight glass dashboard); brief beats the roll; seed: pinned-by-brief.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f3f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0d16' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${jetbrains.variable}`}
    >
      <body>
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <a href="#main" className="sr-only-focusable">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
