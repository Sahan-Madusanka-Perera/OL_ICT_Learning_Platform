/**
 * The session runner gets its own bare frame — no navigation, no streak
 * counter, nothing to click away to. A student answering a question should have
 * exactly one thing in front of them.
 *
 * It keeps the wash rather than going to a flat surface. The question sheet is
 * the one opaque object on this screen, and it can only read as raised if
 * there is something behind it to be raised from.
 */
export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
