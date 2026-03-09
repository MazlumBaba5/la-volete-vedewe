import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-main)' }}
    >
      {/* Minimal header */}
      <header
        className="px-6 h-14 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <Link href="/">
          <span
            className="text-xl font-black"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #ff6eb4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Lvvd
          </span>
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to home
        </Link>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
