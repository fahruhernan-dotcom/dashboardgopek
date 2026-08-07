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

export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}

import { DASHBOARD_LAYOUT } from '@/dashboard/broker/sembako_broker/components/beranda/dashboardLayoutConfig'

export function useResponsiveLayout() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTabletPortrait = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isTabletLandscape = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)')
  const isDesktopXL = useMediaQuery('(min-width: 1280px)')

  let mode = 'mobile'
  if (isDesktopXL) {
    mode = 'desktop-xl'
  } else if (isTabletLandscape) {
    mode = 'tablet-landscape'
  } else if (isTabletPortrait) {
    mode = 'tablet-portrait'
  } else if (isMobile) {
    mode = 'mobile'
  } else {
    mode = 'desktop-xl' // Default fallback
  }

  const config = DASHBOARD_LAYOUT[mode] || DASHBOARD_LAYOUT['desktop-xl']
  return {
    mode,
    ...config,
  }
}
