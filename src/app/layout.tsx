import type { Metadata, Viewport } from 'next';
import { Silkscreen, Source_Sans_3 } from 'next/font/google';
import './globals.css';

/**
 * Two voices, as the source system had two.
 *
 * Silkscreen is the pixel voice — chrome, labels, and every monumental
 * numeral, rendered only at whole-pixel sizes so the bitmap stays crisp.
 * One weight: in a world where emphasis is inversion, a synthesised bold
 * would be a second emphasis competing with the only one that means
 * anything.
 *
 * Source Sans 3 is the reading voice. A pixel face at 17px for three
 * paragraphs of explanation would be cruelty.
 *
 * Both self-hosted by next/font — no request to a font CDN. One fewer round
 * trip on a slow connection, and one fewer place that learns which students
 * are studying at 11pm.
 */
const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-silkscreen',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-source-sans',
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

/* eslint-disable react/no-danger */
const DIRECTION_CONTRACT = `
  IMPECCABLE DIRECTION CONTRACT — two-state

  THESIS: An ICT syllabus whose Unit 3 is two-state data representation, rendered
  in two states. Refuses the practice-app dashboard of coloured progress rings and
  green ticks; correctness cannot be a colour here because there is no colour.

  OWN-WORLD: #000 and #FFF only. Every grey is a 4x4 ordered dither at 1:1. Windows
  with 1px black chrome and Silkscreen title bars on a 50% dither desktop. Zero
  radius, zero shadow. Silkscreen for chrome and numerals, Source Sans 3 for
  reading. Emphasis is inversion, rationed to one element per viewport.

  STORY: A tired fifteen-year-old sees what they know and what they do not, in a
  system that shows no number it has not earned, and starts the set chosen for them.

  FIRST VIEWPORT: Dither desktop; full-width windows with ink-on-white title bars;
  the recommended set's composition as text beside its count in 48px Silkscreen; its
  primary action is the viewport's one inverted element. Mastery as bit-strips,
  quantities in reserved digit slots that align down the register.

  FORM: Windows on a dithered desktop. World committed in DESIGN.md before this run
  and confirmed by the user this session — no direction roll, no seed key.

  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
  review, the verdict, and DESIGN.md
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${silkscreen.variable} ${sourceSans.variable}`}>
      <body>
        <div dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }} />
        <a href="#main" className="sr-only-focusable">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
