import type { Metadata } from 'next';
import { Label } from '@/components/ui/window';

export const metadata: Metadata = { title: 'Privacy' };

/**
 * Written to be read by a fifteen-year-old, because that is who it is about.
 * No defined terms, no "processing of personal data pursuant to".
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[42rem] px-3 py-12 sm:px-5 sm:py-14">
      <h1 className="font-pixel text-[24px] uppercase leading-tight sm:text-[32px]">Privacy</h1>
      <p className="mt-5 text-[17px] leading-relaxed">
        This site is used by school students, so we collect as little as we can and
        explain all of it here. No lawyer-speak.
      </p>

      <S title="What we collect">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>The name you choose — a nickname is fine.</li>
          <li>Your email address, so you can sign in and reset your password.</li>
          <li>Whether you are in Grade 10 or 11.</li>
          <li>Which questions you answered, what you chose, and when.</li>
        </ul>
        <p>
          We do <strong>not</strong> ask for your date of birth, your address, your phone
          number, your school, your NIC, or your index number.
        </p>
      </S>

      <S title="What we do with it">
        <p>
          Your answers are used to work out which topics you know well and which you do
          not, and to decide what to show you next. That is the whole purpose.
        </p>
        <p>
          We do not sell it. We do not share it with advertisers. We do not run
          third-party behavioural tracking on this site — no advertising pixels, no
          analytics SDK following you around. Our own usage statistics stay on our own
          servers.
        </p>
      </S>

      <S title="Who can see your progress">
        <p>
          You. That is it. Other students cannot see your scores, your mistakes, or your
          topic mastery. There is no public profile.
        </p>
        <p>
          If we ever add a leaderboard, it will be off by default, it will show only the
          name you chose, and it will never show your school or your grade.
        </p>
      </S>

      <S title="Deleting your account">
        <p>
          Go to Settings and delete it. It happens immediately, and it is a real deletion —
          your profile, your answers, your progress and your mistake book are all removed.
          You do not have to email anyone or explain why.
        </p>
      </S>

      <S title="Cookies">
        <p>
          One cookie, which keeps you signed in. It is not used for advertising and it does
          not follow you to other sites. Signing out removes it.
        </p>
      </S>

      <S title="Keeping it safe">
        <p>
          Passwords are hashed, never stored as text. Everything travels over HTTPS. Only
          the small number of people who run the platform can reach the database, and
          administrative actions are logged.
        </p>
      </S>

      <S title="If you are a parent">
        <p>
          You are welcome to look through the site with your child. There is no chat, no
          messaging between students, no user-uploaded content and no advertising. The
          only thing a student can send us is a report that a question looks wrong.
        </p>
      </S>
    </article>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9 border-t border-ink pt-7">
      <Label as="h2">{title}</Label>
      <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}
