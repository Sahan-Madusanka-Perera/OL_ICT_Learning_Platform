import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-ink bg-paper px-3 py-3 sm:px-5">
        <Link href="/" className="ant-focus font-pixel text-[16px] uppercase leading-none">
          O/L ICT Practice
        </Link>
      </header>

      <main
        id="main"
        className="flex flex-1 items-start justify-center px-0 pb-16 pt-4 sm:items-center sm:px-5 sm:pt-0"
      >
        <div className="w-full max-w-[26rem]">{children}</div>
      </main>
    </div>
  );
}
