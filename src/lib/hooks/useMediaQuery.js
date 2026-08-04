import { useSyncExternalStore } from 'react'
import { useDevicePreview } from '@/lib/context/DevicePreviewContext'

function evalMediaQuery(query, simulatedWidth) {
  if (simulatedWidth != null) {
    const minMatch = query.match(/\(min-width:\s*(\d+)px\)/)
    if (minMatch) return simulatedWidth >= parseInt(minMatch[1], 10)

    const maxMatch = query.match(/\(max-width:\s*(\d+)px\)/)
    if (maxMatch) return simulatedWidth <= parseInt(maxMatch[1], 10)
  }

  if (typeof window === 'undefined') return false
  return window.matchMedia(query).matches
}

export function useMediaQuery(query) {
  const { simulatedWidth } = useDevicePreview()

  const subscribe = (callback) => {
    if (typeof window === 'undefined') return () => {}
    const mq = window.matchMedia(query)
    mq.addEventListener('change', callback)
    return () => mq.removeEventListener('change', callback)
  }

  const getSnapshot = () => {
    return evalMediaQuery(query, simulatedWidth)
  }

  const getServerSnapshot = () => {
    return false
  }

  const realMatch = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (simulatedWidth != null) {
    return evalMediaQuery(query, simulatedWidth)
  }

  return realMatch
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}
