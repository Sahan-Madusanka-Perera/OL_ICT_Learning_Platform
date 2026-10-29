'use client';

import { useState, useTransition } from 'react';
import { Window } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { deleteAccountAction } from '@/lib/actions/account';

/**
 * Account deletion.
 *
 * Deliberately real: this cascades through every table. A student who wants
 * to leave should be able to, without emailing anyone and without a dark
 * pattern in the way. The confirmation exists to prevent accidents, not to
 * discourage the choice — which is why the confirming control is the
 * ordinary primary and nothing here is dressed up to look dangerous beyond
 * the doubled chrome that says "this window is different".
 */
export function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [pending, startTransition] = useTransition();

  return (
    <Window
      title="Delete your account"
      note="Permanent — nothing is kept"
      className="shadow-[inset_0_0_0_1.5px_var(--color-wrong),var(--shadow-raised)]"
    >
      {!confirming ? (
        <>
          <p className="max-w-prose text-[15px] leading-relaxed text-muted">
            This removes your profile, your answer history, your progress and your mistake
            book. Nothing is kept, and it cannot be undone.
          </p>
          <Button variant="secondary" size="lg" className="mt-5" onClick={() => setConfirming(true)}>
            Delete my account
          </Button>
        </>
      ) : (
        <div>
          <p className="text-[15px] leading-relaxed">
            Type <code>DELETE</code> to confirm.
          </p>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            aria-label="Type DELETE to confirm"
            className="mt-3 h-13 w-full max-w-xs rounded-tile bg-sunken px-4 font-mono text-[16px] shadow-[inset_0_0_0_1px_var(--color-line)] focus:bg-raised"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="lg"
              disabled={typed !== 'DELETE' || pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteAccountAction();
                })
              }
            >
              {pending ? 'Deleting…' : 'Permanently delete'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setConfirming(false);
                setTyped('');
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Window>
  );
}
