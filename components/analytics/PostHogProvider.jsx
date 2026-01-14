'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * PostHog Page Tracker - Wrapped in Suspense
 */
function PostHogPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views on route change (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return;

    import('@/lib/analytics/posthog').then(({ trackPageView }) => {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      trackPageView(pathname, { url });
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * PostHog Provider
 * Initializes PostHog and tracks page views
 */
export function PostHogProvider({ children }) {
  // Initialize PostHog on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('@/lib/analytics/posthog').then(({ initPostHog }) => {
      initPostHog();
    });
  }, []);

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <PostHogPageTracker />
      </Suspense>
    </>
  );
}
