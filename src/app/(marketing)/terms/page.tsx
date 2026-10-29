import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-[46rem] px-3 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-10">
      <h1 className="page-title">Terms of use</h1>
      <p className="mb-10 mt-5 text-[17px] leading-relaxed text-muted">
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
    <section className="glass mt-4 rounded-[24px] p-6 sm:rounded-xl sm:p-9">
      <h2 className="text-[22px] leading-tight tracking-[-0.03em]">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-muted [&_strong]:text-ink">{children}</div>
    </section>
  );
}
