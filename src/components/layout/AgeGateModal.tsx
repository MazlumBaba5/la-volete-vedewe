'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'lvvd-age-gate-v1'

export default function AgeGateModal() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false)
  const [isPolicyConfirmed, setIsPolicyConfirmed] = useState(false)

  useEffect(() => {
    const accepted = window.localStorage.getItem(STORAGE_KEY) === 'accepted'
    const frame = window.requestAnimationFrame(() => {
      setIsAccepted(accepted)
      setIsHydrated(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    document.documentElement.classList.toggle('age-gate-lock', !isAccepted)
    document.body.classList.toggle('age-gate-lock', !isAccepted)

    return () => {
      document.documentElement.classList.remove('age-gate-lock')
      document.body.classList.remove('age-gate-lock')
    }
  }, [isAccepted, isHydrated])

  if (!isHydrated || isAccepted) {
    return null
  }

  const canContinue = isAdultConfirmed && isPolicyConfirmed

  function handleAccept() {
    if (!canContinue) return

    window.localStorage.setItem(STORAGE_KEY, 'accepted')
    setIsAccepted(true)
  }

  function handleLeave() {
    window.location.href = 'https://www.google.com'
  }

  return (
    <div className="age-gate-backdrop">
      <div className="age-gate-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em]"
              style={{ background: 'rgba(233,30,140,0.14)', color: '#f9a8d4', border: '1px solid rgba(233,30,140,0.25)' }}>
              Adults only
            </span>
            <h2 className="mt-4 text-2xl font-black text-white">Before you continue</h2>
          </div>
          <button
            type="button"
            onClick={handleLeave}
            className="text-sm font-semibold transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Leave
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-6" style={{ color: '#d1d5db' }}>
          <p>
            This platform contains adult-oriented listings and is intended only for visitors aged 18 or older.
            Continue only if accessing this content is legal in your country.
          </p>
          <p>
            By entering, you confirm that you are of legal age, understand the nature of the content, and agree to use
            the website responsibly and lawfully.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <label className="age-gate-check">
            <input
              type="checkbox"
              checked={isAdultConfirmed}
              onChange={(event) => setIsAdultConfirmed(event.target.checked)}
            />
            <span>I confirm that I am at least 18 years old.</span>
          </label>

          <label className="age-gate-check">
            <input
              type="checkbox"
              checked={isPolicyConfirmed}
              onChange={(event) => setIsPolicyConfirmed(event.target.checked)}
            />
            <span>I agree to the site rules, privacy expectations, and adult-content warning.</span>
          </label>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAccept}
            disabled={!canContinue}
            className="btn-accent justify-center sm:flex-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enter site
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="btn-ghost sm:flex-1"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}
