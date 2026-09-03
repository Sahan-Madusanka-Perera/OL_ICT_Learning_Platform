'use client';

import { useSyncExternalStore, useCallback } from 'react';

import { isSoundOn, setSoundOn, subscribe, serverSnapshot } from '@/lib/sound/preference';
import { play } from '@/lib/sound/bleeps';
import { SoundOnIcon, SoundOffIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';

/**
 * Read the sound setting.
 *
 * `useSyncExternalStore` rather than `useState` + an effect: the toggle in the
 * session title bar and the one on the settings page are two mounts of the same
 * fact, and they must never disagree.
 */
export function useSound() {
  const on = useSyncExternalStore(subscribe, isSoundOn, serverSnapshot);

  /**
   * Play a bleep if — and only if — sound is on. Every caller goes through
   * this, so the decision to make noise exists in exactly one place.
   */
  const bleep = useCallback(
    (name: Parameters<typeof play>[0]) => {
      if (!on) return;
      play(name);
    },
    [on],
  );

  return { on, bleep, setOn: setSoundOn };
}

/**
 * The switch.
 *
 * Turning sound *on* plays a note immediately. That is not decoration: it is
 * the only way to answer "how loud is this going to be", and it doubles as the
 * user gesture browsers require before an AudioContext will start. Turning it
 * off is silent, which is the whole point of turning it off.
 */
export function SoundToggle({
  className,
  labelled = false,
}: {
  className?: string;
  /** Show the word beside the icon. Off in dense chrome, on in settings. */
  labelled?: boolean;
}) {
  const { on, setOn } = useSound();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        if (next) play('select');
      }}
      className={cn(
        'ant-focus font-pixel flex items-center gap-2 border border-ink px-2 text-[16px] uppercase leading-none',
        'hover:bg-ink hover:text-paper',
        labelled ? 'h-14 px-3' : 'h-10',
        className,
      )}
    >
      {on ? <SoundOnIcon size={24} /> : <SoundOffIcon size={24} />}
      {/* The word ships with the mark, the way every other state in this
          system does — an icon whose two forms differ by a few cells is not
          something to bet a setting on. In dense chrome it is screen-reader
          only, so the control still announces itself. */}
      <span className={labelled ? undefined : 'sr-only-live'}>
        {on ? 'Sound on' : 'Sound off'}
      </span>
    </button>
  );
}
