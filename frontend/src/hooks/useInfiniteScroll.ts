import { useEffect, useRef, useState } from 'react'

const DEFAULT_BATCH_SIZE = 25

export function useInfiniteScroll<T>(items: readonly T[], batchSize = DEFAULT_BATCH_SIZE) {
  const [visibleCount, setVisibleCount] = useState(batchSize)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    setVisibleCount(batchSize)
  }, [batchSize, items.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || visibleCount >= items.length) return

    if (typeof IntersectionObserver === 'undefined') {
      setVisibleCount(items.length)
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((current) => Math.min(current + batchSize, items.length))
      }
    }, { rootMargin: '320px 0px' })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [batchSize, items.length, visibleCount])

  const visibleItems = items.slice(0, visibleCount)
  return {
    visibleItems,
    sentinelRef,
    hasMore: visibleItems.length < items.length,
    totalCount: items.length,
  }
}
