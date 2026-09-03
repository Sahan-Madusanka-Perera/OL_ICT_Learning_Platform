import { requireUserPage } from '@/lib/auth/guards';
import { isStaff } from '@/lib/auth/rbac';
import { countMistakes, countDueReviews } from '@/lib/services/recommendations';
import { StudentNav } from '@/components/student-nav';
import { StudentChrome } from '@/components/student-chrome';
import { signOutAction } from '@/lib/actions/auth';

/**
 * The desktop.
 *
 * Windows tile on a 50% dither ground; the chrome above them is the one
 * persistent frame, and it stands down inside a session. On a phone the
 * windows go edge to edge and the dither shows only in the gaps between
 * them, which is where it belongs — content never sits on a dither.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage();
  const [mistakes, due] = await Promise.all([
    countMistakes(user.id),
    countDueReviews(user.id),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <StudentChrome
        displayName={user.displayName}
        currentStreak={user.currentStreak}
        isStaff={isStaff(user.role)}
        mistakeCount={mistakes}
        signOut={signOutAction}
      />

      <main
        id="main"
        className="mx-auto w-full max-w-5xl flex-1 px-0 pb-28 pt-3 sm:px-4 sm:pb-10 sm:pt-5"
      >
        {children}
      </main>

      <StudentNav mistakeCount={mistakes} dueCount={due} />
    </div>
  );
}
