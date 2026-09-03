import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/auth/guards';
import { getBookmarks } from '@/lib/services/recommendations';
import { Window, Label } from '@/components/ui/window';
import { renderInline } from '@/lib/utils/markdown';

export const metadata: Metadata = { title: 'Saved questions' };

export default async function BookmarksPage() {
  const user = await requireUserPage('/bookmarks');
  const bookmarks = await getBookmarks(user.id);

  return (
    <div className="flex flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <h1 className="font-pixel text-[24px] uppercase leading-tight">Saved questions</h1>
      </header>

      {bookmarks.length === 0 ? (
        <Window title="Nothing saved yet">
          <p className="text-[15px] leading-relaxed">
            Tap the bookmark mark on any question to keep it here.
          </p>
        </Window>
      ) : (
        <Window
          title="Saved"
          note={`${bookmarks.length}`}
          bodyClassName="px-0 py-0 sm:px-0"
        >
          <ul>
            {bookmarks.map((b) => (
              <li
                key={b.questionId}
                className="border-b border-dashed border-ink px-3 py-3 last:border-b-0 sm:px-4"
              >
                <Label>{b.nodeTitle}</Label>
                <div
                  className="mt-2 line-clamp-2 text-[15px] leading-relaxed"
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
