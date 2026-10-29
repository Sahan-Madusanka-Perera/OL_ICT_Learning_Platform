import Link from 'next/link';
import { BrandTile } from '@/components/brand';

/**
 * The frame around signing in and signing up.
 *
 * One raised sheet centred on the wash with nothing else on screen but the
 * brand tile. The links below the sheet sit on the calm centre of the wash,
 * where a 15px link stays easy to read.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-3 py-4 sm:px-6 sm:py-6">
        <Link href="/" className="inline-flex items-center gap-3 rounded-tile">
          <BrandTile />
          <span className="text-[15px] font-medium tracking-[-0.02em]">O/L ICT Practice</span>
        </Link>
      </header>

      <main
        id="main"
        className="flex flex-1 items-start justify-center px-3 pb-20 pt-4 sm:items-center sm:px-6 sm:pt-0"
      >
        <div className="w-full max-w-[28rem]">{children}</div>
      </main>
    </div>
  );
}
