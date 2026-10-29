import { requireUserPage } from '@/lib/auth/guards';
import { isStaff } from '@/lib/auth/rbac';
import { countMistakes, countDueReviews } from '@/lib/services/recommendations';
import { StudentNav, StudentRail } from '@/components/student-nav';
import { StudentChrome } from '@/components/student-chrome';
import { StudentMain } from '@/components/student-main';
import { signOutAction } from '@/lib/actions/auth';

/**
 * The signed-in shell.
 *
 * Glass sheets float over the wash with the header islands above them and
 * the icon rail beside them. Every part stands down inside a session — the
 * header, both navs and the content well itself — so the runner gets the
 * whole screen. See
 * `StudentMain` for why the well has to be a client component to manage that.
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

      <StudentRail isStaff={isStaff(user.role)} signOut={signOutAction} />

      <StudentMain>{children}</StudentMain>

      <StudentNav mistakeCount={mistakes} dueCount={due} />
    </div>
  );
}
