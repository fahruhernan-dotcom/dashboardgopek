import { useSyncExternalStore } from 'react'

export function useMediaQuery(query) {
  const subscribe = (callback) => {
    if (typeof window === 'undefined') return () => {}
    const mq = window.matchMedia(query)
    mq.addEventListener('change', callback)
    return () => mq.removeEventListener('change', callback)
  }

  const getSnapshot = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  }

  const getServerSnapshot = () => {
    return false
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
