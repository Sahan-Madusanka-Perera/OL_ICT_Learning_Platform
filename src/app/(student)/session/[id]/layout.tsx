/**
 * The session runner gets its own bare frame — no navigation, no streak
 * counter, nothing to click away to. A student answering a question should
 * have exactly one thing in front of them, so the desktop's dither does not
 * show here either: the session fills the screen.
 */
export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-paper">{children}</div>;
}
