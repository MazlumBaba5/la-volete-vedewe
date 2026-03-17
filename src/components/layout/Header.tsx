'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LISTING_CATEGORY_GROUPS, MASSAGE_GROUP } from '@/lib/listing-navigation';

const SERVICE_LINKS = [
  { label: 'InCall', service: 'Incall' },
  { label: 'OutCall (Escort)', service: 'Outcall' },
  { label: 'Erotic massage', service: 'Erotic massage' },
  { label: 'BDSM', service: 'BDSM' },
  { label: 'SexCam', service: 'SexCam' },
] as const;

export default function Header() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [desktopExpanded, setDesktopExpanded] = useState<string | null>(null);
  const desktopNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const role = user?.user_metadata?.role ?? null;
      setUserRole(role);
      if (!role) {
        setChatUnreadCount(0);
      }
      setAuthLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user?.user_metadata?.role ?? null;
      setUserRole(role);
      if (!role) {
        setChatUnreadCount(0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userRole) return;

    const loadUnread = async () => {
      try {
        const res = await fetch('/api/chat', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json() as { items?: Array<{ unreadCount?: number }> };
        const unread = (json.items ?? []).reduce((sum, item) => sum + (item.unreadCount ?? 0), 0);
        setChatUnreadCount(unread);
      } catch {
        // silent: header badge should not block the page
      }
    };

    void loadUnread();
    const id = window.setInterval(() => {
      void loadUnread();
    }, 15000);

    return () => window.clearInterval(id);
  }, [userRole]);

  useEffect(() => {
    if (!desktopExpanded) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && desktopNavRef.current && !desktopNavRef.current.contains(target)) {
        setDesktopExpanded(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDesktopExpanded(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [desktopExpanded]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const dashboardHref = userRole === 'advisor' ? '/advisor/dashboard' : '/guest/dashboard';
  const chatHref = userRole === 'advisor' ? '/advisor/dashboard?tab=chat' : '/guest/dashboard?tab=chat';

  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 lg:px-8 h-14 gap-4"
        style={{ maxWidth: 1400, margin: '0 auto' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="text-xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #ff6eb4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            L❤❤D
          </span>
        </Link>

        {/* Search bar – desktop */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim())
              window.location.href = `/listings?q=${encodeURIComponent(searchQuery)}`;
          }}
          className="hidden md:flex flex-1 max-w-lg items-center gap-2"
        >
          <div
            className="flex items-center flex-1 rounded-lg overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <svg
              className="w-4 h-4 ml-3 shrink-0"
              style={{ color: 'var(--text-muted)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, name or service…"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {authLoaded && (
            userRole ? (
              <>
                <Link
                  href={dashboardHref}
                  className="hidden sm:inline-flex text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2"
                >
                  Dashboard
                </Link>
                <Link
                  href={chatHref}
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2"
                >
                  Chat
                  {chatUnreadCount > 0 && (
                    <span
                      aria-label={`${chatUnreadCount} unread chat messages`}
                      title={`${chatUnreadCount} unread`}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: '#ff4fa0', boxShadow: '0 0 0 3px rgba(255,79,160,0.22)' }}
                    />
                  )}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden sm:inline-flex text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-2"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2"
                >
                  Sign in
                </Link>
                <Link href="/register" className="btn-accent text-sm px-4 py-2">
                  Post an ad
                </Link>
              </>
            )
          )}
          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav
        className="hidden md:block border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          ref={desktopNavRef}
          className="flex items-center px-4 lg:px-8 gap-2 py-2"
          style={{ maxWidth: 1400, margin: '0 auto' }}
        >
          {LISTING_CATEGORY_GROUPS.map((group) => {
            const isExpanded = desktopExpanded === group.label;

            return (
              <div key={group.label} className="relative">
                <button
                  type="button"
                  onClick={() => setDesktopExpanded(isExpanded ? null : group.label)}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
                  aria-expanded={isExpanded}
                  aria-haspopup="menu"
                >
                  <span>{group.icon}</span>
                  {group.label}
                  <svg className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180 text-gray-300' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="absolute left-0 top-full z-40 pt-2">
                    <div
                      className="min-w-[230px] rounded-2xl p-2"
                      style={{
                        background: 'rgba(19, 19, 31, 0.98)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
                      }}
                    >
                      <Link
                        href={`/listings?category=${group.category}`}
                        onClick={() => setDesktopExpanded(null)}
                        className="mb-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white"
                        style={{ background: 'rgba(233,30,140,0.16)' }}
                      >
                        <span>View all {group.label}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#f472b6' }}>
                          {group.label}
                        </span>
                      </Link>
                      {SERVICE_LINKS.map((item) => (
                        <Link
                          key={`${group.label}-${item.label}`}
                          href={`/listings?category=${group.category}&services=${encodeURIComponent(item.service)}`}
                          onClick={() => setDesktopExpanded(null)}
                          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-300 transition-colors hover:text-white"
                        >
                          <span>{item.label}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                            {group.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="relative">
            <button
              type="button"
              onClick={() => setDesktopExpanded(desktopExpanded === MASSAGE_GROUP.label ? null : MASSAGE_GROUP.label)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
              aria-expanded={desktopExpanded === MASSAGE_GROUP.label}
              aria-haspopup="menu"
            >
              <span>{MASSAGE_GROUP.icon}</span>
              {MASSAGE_GROUP.label}
              <svg className={`h-4 w-4 text-gray-500 transition-transform ${desktopExpanded === MASSAGE_GROUP.label ? 'rotate-180 text-gray-300' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {desktopExpanded === MASSAGE_GROUP.label && (
              <div className="absolute left-0 top-full z-40 pt-2">
                <div
                  className="min-w-[230px] rounded-2xl p-2"
                  style={{
                    background: 'rgba(19, 19, 31, 0.98)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
                  }}
                >
                  <Link
                    href={`/listings?services=${encodeURIComponent('Massage')},${encodeURIComponent('Erotic massage')}`}
                    onClick={() => setDesktopExpanded(null)}
                    className="mb-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white"
                    style={{ background: 'rgba(233,30,140,0.16)' }}
                  >
                    <span>View all massages</span>
                    <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#f472b6' }}>
                      Massages
                    </span>
                  </Link>
                  {SERVICE_LINKS.map((item) => (
                    <Link
                      key={`massage-${item.label}`}
                      href={`/listings?services=${encodeURIComponent(item.service)}`}
                      onClick={() => setDesktopExpanded(null)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-300 transition-colors hover:text-white"
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                        Massages
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-3"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
        >
          {/* Mobile search */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <svg
              className="w-4 h-4 ml-3"
              style={{ color: 'var(--text-muted)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            {LISTING_CATEGORY_GROUPS.map((group) => {
              const isExpanded = mobileExpanded === group.label;

              return (
                <div
                  key={group.label}
                  className="rounded-xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <button
                    type="button"
                    onClick={() => setMobileExpanded(isExpanded ? null : group.label)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm font-medium text-gray-200">{group.icon} {group.label}</span>
                    <svg className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="space-y-1 px-2 pb-2">
                      <Link
                        href={`/listings?category=${group.category}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-white"
                        style={{ background: 'rgba(233,30,140,0.16)' }}
                      >
                        View all {group.label}
                      </Link>
                      {SERVICE_LINKS.map((item) => (
                        <Link
                          key={`${group.label}-${item.label}`}
                          href={`/listings?category=${group.category}&services=${encodeURIComponent(item.service)}`}
                          onClick={() => setMobileOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-gray-300"
                          style={{ background: 'var(--bg-elevated)' }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div
              className="rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <button
                type="button"
                onClick={() => setMobileExpanded(mobileExpanded === MASSAGE_GROUP.label ? null : MASSAGE_GROUP.label)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-medium text-gray-200">{MASSAGE_GROUP.icon} {MASSAGE_GROUP.label}</span>
                <svg className={`h-4 w-4 text-gray-500 transition-transform ${mobileExpanded === MASSAGE_GROUP.label ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {mobileExpanded === MASSAGE_GROUP.label && (
                <div className="space-y-1 px-2 pb-2">
                  <Link
                    href={`/listings?services=${encodeURIComponent('Massage')},${encodeURIComponent('Erotic massage')}`}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-white"
                    style={{ background: 'rgba(233,30,140,0.16)' }}
                  >
                    View all massages
                  </Link>
                  {SERVICE_LINKS.map((item) => (
                    <Link
                      key={`massage-${item.label}`}
                      href={`/listings?services=${encodeURIComponent(item.service)}`}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-300"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {userRole ? (
              <>
                <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className="btn-ghost text-sm px-4 py-2 flex-1 text-center">
                  Dashboard
                </Link>
                <Link href={chatHref} onClick={() => setMobileOpen(false)} className="btn-ghost text-sm px-4 py-2 flex-1 text-center inline-flex items-center justify-center gap-2">
                  Chat
                  {chatUnreadCount > 0 && (
                    <span
                      aria-label={`${chatUnreadCount} unread chat messages`}
                      title={`${chatUnreadCount} unread`}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: '#ff4fa0', boxShadow: '0 0 0 3px rgba(255,79,160,0.22)' }}
                    />
                  )}
                </Link>
                <button onClick={handleSignOut} className="btn-ghost text-sm px-4 py-2 flex-1 text-center">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm px-4 py-2 flex-1 text-center">
                  Sign in
                </Link>
                <Link href="/register" className="btn-accent text-sm px-4 py-2 flex-1 text-center">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
