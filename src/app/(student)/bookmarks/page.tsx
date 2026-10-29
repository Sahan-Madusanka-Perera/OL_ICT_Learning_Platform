import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/auth/guards';
import { getBookmarks } from '@/lib/services/recommendations';
import { Window, ROW } from '@/components/ui/window';
import { cn } from '@/lib/utils/cn';
import { renderInline } from '@/lib/utils/markdown';

export const metadata: Metadata = { title: 'Saved questions' };

export default async function BookmarksPage() {
  const user = await requireUserPage('/bookmarks');
  const bookmarks = await getBookmarks(user.id);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="px-1 pt-2 sm:pt-4">
        <h1 className="page-title">Saved questions</h1>
        <p className="mt-3 text-[15px] text-muted">
          Questions you bookmarked to come back to.
        </p>
      </header>

      {bookmarks.length === 0 ? (
        <Window tone="raised" title="Nothing saved yet" className="max-w-2xl">
          <p className="text-[15px] leading-relaxed text-muted">
            Tap the bookmark mark on any question to keep it here.
          </p>
        </Window>
      ) : (
        <Window
          title="Saved"
          count={bookmarks.length}
          className="max-w-4xl"
          bodyClassName="px-0 pb-2 sm:px-0 sm:pb-2"
        >
          <ul>
            {bookmarks.map((b) => (
              <li key={b.questionId} className={cn('border-t border-line-soft py-4', ROW)}>
                <p className="text-[13px] text-muted">{b.nodeTitle}</p>
                <div
                  className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderInline(b.stem) }}
                />
              </li>
            ))}
          </ul>
        </Window>
      )}
    </div>
  );
}
