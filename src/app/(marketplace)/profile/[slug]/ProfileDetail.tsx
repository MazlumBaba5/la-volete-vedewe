'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type Profile, type ProfilePhoto, type ReviewItem } from '@/types';
import { TierBadge } from '@/components/ui/Badge';
import ContactModal from '@/components/marketplace/ContactModal';
import ProfileCard from '@/components/marketplace/ProfileCard';

interface Props {
  profile: Profile;
  related: Profile[];
}

type ReviewsPayload = {
  enabled: boolean;
  averageRating: number;
  reviewCount: number;
  viewerRole: string | null;
  viewerHasReviewed: boolean;
  canReview: boolean;
  reviews: ReviewItem[];
}

function StarRow({ rating, size = 'text-base' }: { rating: number; size?: string }) {
  return (
    <div className={`flex items-center gap-1 ${size}`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} style={{ color: index < rating ? '#fbbf24' : 'rgba(255,255,255,0.18)' }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function ProfileDetail({ profile, related }: Props) {
  const reviewsApiUrl = profile.advisorId ? `/api/advisor/${profile.advisorId}/reviews` : null;
  const [selectedPhoto, setSelectedPhoto] = useState<ProfilePhoto | undefined>(
    profile.photos.find((p: ProfilePhoto) => p.isMain) ?? profile.photos[0]
  );
  const [showContact, setShowContact] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(Boolean(profile.reviewsEnabled && reviewsApiUrl));
  const [reviewsError, setReviewsError] = useState('');
  const [reviewsData, setReviewsData] = useState<ReviewsPayload>({
    enabled: Boolean(profile.reviewsEnabled),
    averageRating: 0,
    reviewCount: 0,
    viewerRole: null,
    viewerHasReviewed: false,
    canReview: false,
    reviews: [],
  });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitMsg, setReviewSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availabilityColor: Record<string, string> = {
    available: 'var(--success)',
    busy: '#f59e0b',
    offline: '#6b7280',
  };

  const availabilityLabel: Record<string, string> = {
    available: 'Available',
    busy: 'Busy',
    offline: 'Offline',
  };

  useEffect(() => {
    if (!profile.reviewsEnabled || !reviewsApiUrl) {
      setReviewsLoading(false);
      return;
    }

    let active = true;

    async function loadReviews() {
      setReviewsLoading(true);
      setReviewsError('');
      try {
        const res = await fetch(reviewsApiUrl, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? 'Unable to load reviews');
        }
        if (active) {
          setReviewsData(json as ReviewsPayload);
        }
      } catch (error) {
        if (active) {
          setReviewsError(error instanceof Error ? error.message : 'Unable to load reviews');
        }
      } finally {
        if (active) {
          setReviewsLoading(false);
        }
      }
    }

    loadReviews();
    return () => {
      active = false;
    };
  }, [profile.reviewsEnabled, reviewsApiUrl]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewSubmitMsg(null);

    if (!reviewsApiUrl) {
      setReviewSubmitMsg({ type: 'error', text: 'Reviews are unavailable on this profile.' });
      setReviewSubmitting(false);
      return;
    }

    try {
      const res = await fetch(reviewsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setReviewSubmitMsg({ type: 'error', text: json.error ?? 'Unable to publish your review' });
        return;
      }

      const refresh = await fetch(reviewsApiUrl, { cache: 'no-store' });
      const refreshJson = await refresh.json();
      if (refresh.ok) {
        setReviewsData(refreshJson as ReviewsPayload);
      }

      setReviewRating(0);
      setReviewTitle('');
      setReviewComment('');
      setReviewSubmitMsg({ type: 'success', text: 'Your review is now visible on this profile.' });
    } catch {
      setReviewSubmitMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      {/* Breadcrumb */}
      <div
        className="px-4 lg:px-8 py-3 text-sm"
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <nav className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link href="/listings" className="hover:text-white transition-colors">
            Listings
          </Link>
          <span>›</span>
          <Link
            href={`/listings?city=${encodeURIComponent(profile.city)}`}
            className="hover:text-white transition-colors"
          >
            {profile.city}
          </Link>
          <span>›</span>
          <span className="text-gray-300">
            {profile.name}
          </span>
        </nav>
      </div>

      <div
        className="px-4 lg:px-8 py-8"
        style={{ maxWidth: 1400, margin: '0 auto' }}
      >
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Photo gallery */}
            <div className="space-y-3">
              {/* Main photo */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ paddingBottom: '66%' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto?.url}
                  alt={profile.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {profile.subscriptionLevel !== 'free' && (
                  <div className="absolute top-4 left-4">
                    <TierBadge level={profile.subscriptionLevel} />
                  </div>
                )}
                {profile.isOnline && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-400"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <span className="online-dot" />
                    Online now
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {profile.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {profile.photos.map((photo: ProfilePhoto) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="shrink-0 rounded-lg overflow-hidden transition-all"
                      style={{
                        width: 80,
                        height: 80,
                        border: `2px solid ${selectedPhoto?.id === photo.id ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-bold text-white text-lg mb-3">About me</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">
                {profile.description}
              </p>
            </div>

            {profile.reviewsEnabled && (
              <div
                className="rounded-xl p-6 space-y-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-2">
                    <h2 className="font-bold text-white text-lg">Reviews</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Real feedback left by registered client accounts.
                    </p>
                  </div>

                  <div className="rounded-xl px-4 py-3 text-right" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-3xl font-black text-white">
                        {reviewsLoading ? '...' : reviewsData.averageRating ? reviewsData.averageRating.toFixed(1) : '0.0'}
                      </span>
                      <StarRow rating={Math.round(reviewsData.averageRating)} size="text-lg" />
                    </div>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {reviewsLoading ? 'Loading reviews...' : `${reviewsData.reviewCount} review${reviewsData.reviewCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </div>

                {reviewSubmitMsg && (
                  <div
                    className="text-xs px-4 py-3 rounded-lg"
                    style={{
                      background: reviewSubmitMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${reviewSubmitMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: reviewSubmitMsg.type === 'success' ? '#86efac' : '#fca5a5',
                    }}
                  >
                    {reviewSubmitMsg.text}
                  </div>
                )}

                {reviewsData.canReview && (
                  <form onSubmit={handleReviewSubmit} className="rounded-xl p-5 space-y-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">Leave your review</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Share a short honest experience. One review per advisor profile.
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-400">Rating</p>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }, (_, index) => {
                          const value = index + 1;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setReviewRating(value)}
                              className="text-2xl transition-transform hover:scale-110"
                              style={{ color: value <= reviewRating ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Review title</label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Amazing vibes, very respectful"
                        className="input-dark"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                      <textarea
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Write your review here..."
                        className="input-dark resize-none"
                      />
                    </div>

                    <button type="submit" disabled={reviewSubmitting} className="btn-accent text-sm px-5 py-2.5">
                      {reviewSubmitting ? 'Publishing...' : 'Publish review'}
                    </button>
                  </form>
                )}

                {!reviewsData.canReview && !reviewsLoading && (
                  <div className="rounded-xl p-4 text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#d1d5db' }}>
                    {!reviewsData.viewerRole
                      ? 'Sign in with a client account to leave a review.'
                      : reviewsData.viewerRole !== 'guest'
                      ? 'Only registered client accounts can leave reviews.'
                      : reviewsData.viewerHasReviewed
                      ? 'You already reviewed this advisor.'
                      : 'Reviews are currently unavailable on this profile.'}
                  </div>
                )}

                {reviewsError && (
                  <p className="text-sm" style={{ color: '#fca5a5' }}>
                    {reviewsError}
                  </p>
                )}

                <div className="space-y-4">
                  {reviewsLoading ? (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading reviews...</p>
                  ) : reviewsData.reviews.length > 0 ? (
                    reviewsData.reviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-xl p-5 space-y-3"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-white">{review.title}</h3>
                            <div className="flex items-center gap-3">
                              <StarRow rating={review.rating} />
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                by {review.reviewerUsername}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(review.createdAt))}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">
                          {review.comment}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No reviews yet. Be the first client to leave one.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Services */}
            <div
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-bold text-white text-lg mb-4">Services offered</h2>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((svc: string) => (
                  <span
                    key={svc}
                    className="px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      background: 'rgba(233,30,140,0.12)',
                      border: '1px solid rgba(233,30,140,0.3)',
                      color: 'var(--accent)',
                    }}
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>

            {/* Attributes */}
            <div
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-bold text-white text-lg mb-4">Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Age', value: `${profile.age} yrs` },
                  { label: 'Nationality', value: profile.nationality },
                  { label: 'Height', value: `${profile.attributes.height} cm` },
                  { label: 'Weight', value: `${profile.attributes.weight} kg` },
                  { label: 'Hair', value: profile.attributes.hair },
                  { label: 'Eyes', value: profile.attributes.eyes },
                  ...(profile.attributes.measurements
                    ? [{ label: 'Measurements', value: profile.attributes.measurements }]
                    : []),
                  { label: 'Ethnicity', value: profile.attributes.ethnicity },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-lg p-3"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </p>
                    <p className="font-medium text-sm text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-bold text-white text-lg mb-3">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang: string) => (
                  <span
                    key={lang}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: '#d1d5db',
                    }}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right column – sticky sidebar */}
          <div className="space-y-4">
            <div
              className="sticky top-4 rounded-2xl p-6 space-y-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* Name & info */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-white">
                      {profile.name}
                    </h1>
                    <p className="text-lg font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {profile.age} yrs
                    </p>
                  </div>
                  {profile.subscriptionLevel !== 'free' && (
                    <TierBadge level={profile.subscriptionLevel} />
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.city}
                  {profile.district ? `, ${profile.district}` : ''}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ background: availabilityColor[profile.availability] }}
                  />
                  <span className="text-sm" style={{ color: availabilityColor[profile.availability] }}>
                    {availabilityLabel[profile.availability]}
                  </span>
                </div>

                {profile.reviewsEnabled && !reviewsLoading && (
                  <div className="mt-4 rounded-xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                          Client reviews
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-2xl font-black text-white">
                            {reviewsData.averageRating ? reviewsData.averageRating.toFixed(1) : '0.0'}
                          </span>
                          <StarRow rating={Math.round(reviewsData.averageRating)} />
                        </div>
                      </div>
                      <span className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>
                        {reviewsData.reviewCount} review{reviewsData.reviewCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Views */}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {profile.views.toLocaleString()} views
              </div>

              {/* Rates */}
              <div>
                <h3 className="font-semibold text-gray-200 mb-3 text-sm">Rates</h3>
                <div className="space-y-2">
                  {profile.rates.map((rate: typeof profile.rates[0]) => (
                    <div
                      key={rate.duration}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      <span className="text-gray-400">{rate.label}</span>
                      <span className="font-bold text-white">€{rate.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowContact(true)}
                className="btn-accent w-full justify-center py-3 text-sm font-semibold"
              >
                📞 Contact {profile.name}
              </button>

              <button
                className="btn-ghost w-full justify-center py-2.5 text-sm"
                onClick={() => {
                  navigator.share?.({
                    title: `${profile.name} – Lvvd`,
                    url: window.location.href,
                  });
                }}
              >
                Share profile
              </button>

              {/* Safety notice */}
              <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                🔒 Your data is safe. We never share your information with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Related profiles */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title mb-6">
              More profiles in <span>{profile.city}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Contact modal */}
      {showContact && (
        <ContactModal profile={profile} onClose={() => setShowContact(false)} />
      )}
    </div>
  );
}
