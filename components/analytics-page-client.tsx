'use client'

import dynamic from 'next/dynamic'

const AnalyticsContent = dynamic(() => import('@/components/analytics-content'), {
  ssr: false,
  loading: () => <div className="p-8">Loading analytics...</div>,
})

interface AnalyticsPageClientProps {
  analytics: any
  studyStats: any
}

export function AnalyticsPageClient({
  analytics,
  studyStats,
}: AnalyticsPageClientProps) {
  return <AnalyticsContent analytics={analytics} studyStats={studyStats} />
}
