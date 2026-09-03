import type { Metadata } from 'next';
import { Label } from '@/components/ui/window';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-[42rem] px-3 py-12 sm:px-5 sm:py-14">
      <h1 className="font-pixel text-[24px] uppercase leading-tight sm:text-[32px]">Terms of use</h1>
      <p className="mt-5 text-[17px] leading-relaxed">
        The short version: use it to study, do not try to break it, and understand what we
        do and do not promise.
      </p>

      <S title="What this is">
        <p>
          A practice tool for the Sri Lankan G.C.E. Ordinary Level ICT examination. It is
          an independent product. We are not affiliated with, endorsed by, or connected to
          the Department of Examinations or the National Institute of Education.
        </p>
      </S>

      <S title="What we promise">
        <p>
          That our questions are checked by people before they are published, that we tell
          you where each question came from, and that we say when we are unsure.
        </p>
      </S>

      <S title="What we do not promise">
        <p>
          We do not promise a grade. We do not claim our questions will appear in the
          examination or predict what will. Any site that promises you an A is not being
          honest with you.
        </p>
      </S>

      <S title="Your account">
        <p>
          Keep your password to yourself. One account per person. If you think someone else
          has got into your account, change your password — that signs out every other
          device.
        </p>
      </S>

      <S title="Fair use">
        <p>
          Do not scrape the question bank, automate access, or republish our explanations.
          Past paper questions belong to the examination authorities; our model questions
          and explanations belong to us.
        </p>
      </S>

      <S title="Mistakes">
        <p>
          We work hard to get answers right, and we still expect to get some wrong. If you
          find one, report it from the question itself — it goes straight to the review
          queue. When we find an error we fix it and re-check the questions around it.
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
