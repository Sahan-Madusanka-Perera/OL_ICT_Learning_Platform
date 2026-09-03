/**
 * Whether sound is on, and where that answer is kept.
 *
 * DEFAULT OFF, AND THAT IS THE DESIGN
 * -----------------------------------
 * The reader this product is written for is on a bus or in a classroom. An app
 * that makes a noise the first time it is opened is one a student gets told off
 * for and then mutes at the operating system, which loses the feature and some
 * of their trust with it. So the default is silence and the student opts in.
 *
 * This needs no reduced-motion special case, which is worth saying out loud:
 * the default is already silence for everyone, so a student who has asked their
 * system for less sensory load gets exactly what they asked for without the
 * product inferring anything. And if they do switch sound on, that stated
 * preference stands — it is not quietly overridden by an OS setting about
 * motion.
 *
 * ONE SOURCE OF TRUTH
 * -------------------
 * A hook that read `localStorage` in each component would let the toggle and
 * the thing making noise disagree. This is a module-level store with
 * subscribers instead, read through `useSyncExternalStore`, so every mounted
 * control re-renders the moment the setting changes — including across two
 * tabs, via the `storage` event.
 */

const KEY = 'ol-ict:sound';

type Listener = () => void;

const listeners = new Set<Listener>();
let cached: boolean | null = null;

function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === 'on') return true;
  } catch {
    // Private mode, or storage disabled. Silence is the safe answer.
    return false;
  }
  // Anything else — "off", or never chosen at all — is silence. There is no
  // condition under which this returns true without the student having said so,
  // which is what makes the reduced-motion case need no special handling.
  return false;
}

export function isSoundOn(): boolean {
  cached ??= read();
  return cached;
}

export function setSoundOn(on: boolean): void {
  cached = on;
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // Preference is not persisted, but it still holds for this session.
  }
  for (const l of listeners) l();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cached = null;
    listener();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * The server always renders "off".
 *
 * The alternative is reading the preference during hydration and flipping the
 * control after paint, which shows every student a speaker icon that changes
 * under them on load. Off is also the honest answer server-side: nothing has
 * made a sound yet.
 */
export function serverSnapshot(): boolean {
  return false;
}
