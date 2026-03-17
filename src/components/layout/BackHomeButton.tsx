'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BackHomeButton() {
  const pathname = usePathname()

  if (pathname === '/') return null

  return (
    <Link
      href="/"
      className="fixed bottom-4 left-4 z-50 rounded-full px-4 py-2 text-sm font-semibold"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: '#fff',
        boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
      }}
    >
      Back home
    </Link>
  )
}
