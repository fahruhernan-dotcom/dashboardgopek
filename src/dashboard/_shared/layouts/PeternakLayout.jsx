import React, { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import AppSidebar from '../components/AppSidebar'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationGenerator } from '@/lib/hooks/useNotifications.jsx'
import { BusinessNameWarningBanner } from '../components/BusinessNameWarningBanner'
import { PlanExpiryBanner } from '../components/PlanExpiryBanner'
import { SidebarProvider } from '@/components/ui/sidebar'
import TopBar from '../components/TopBar'
import InstallAppPrompt from '@/components/InstallAppPrompt'

export default function PeternakLayout() {
  const { _profile, loading, tenant, isSuperadmin } = useAuth()
  const location = useLocation()
  useNotificationGenerator()
  // useForceDarkMode() - Disabled to allow light mode in Peternak Dashboard
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [_rightAction, setRightAction] = useState(null)

  // Reset rightAction on every navigation
  useEffect(() => {
    setRightAction(null)
  }, [location.pathname])

  // Listen to sidebar open events from BottomNav (Menu tab) and MobileHeader
  useEffect(() => {
    const openHandler = () => setSidebarOpen(true)
    const toggleHandler = () => setSidebarOpen(prev => !prev)
    window.addEventListener('open-mobile-sidebar', openHandler)
    window.addEventListener('toggleMobileSidebar', toggleHandler)
    return () => {
      window.removeEventListener('open-mobile-sidebar', openHandler)
      window.removeEventListener('toggleMobileSidebar', toggleHandler)
    }
  }, [])

  // Swipe-right-from-left-edge to open sidebar
  const swipeStartX = useRef(null)
  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    
    if (!sidebarOpen && swipeStartX.current < 40 && dx > 60) {
      setSidebarOpen(true)
    } else if (sidebarOpen && dx < -50) {
      setSidebarOpen(false)
    }
    swipeStartX.current = null
  }

  // Visible loading state — must not return null while AppContentLayout's
  // overlay is between transitions, otherwise root renders only <Toaster />.
  if (loading) {
    return (
      <div className="bg-[#FAFAFA] dark:bg-[#06090F] text-slate-900 dark:text-[#F1F5F9]" style={{ minHeight: '100vh', padding: 24 }}>
        Memuat dashboard...
      </div>
    )
  }

  const renderContent = () => {
    if (!isDesktop) {
      return (
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="bg-[#FAFAFA] dark:bg-[#06090F]"
          style={{
          minHeight: '100vh',
          maxWidth: '480px',
          margin: '0 auto',
          paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
          position: 'relative',
          overflowX: 'hidden',
          overscrollBehaviorX: 'none'
        }}>
          {/* TopBar removed from mobile branch because pages use MobileHeader for better control/overlap */}
          
          <SidebarProvider style={{ minHeight: 0 }}>
            <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </SidebarProvider>
          <BusinessNameWarningBanner />
          {!isSuperadmin && <PlanExpiryBanner tenant={tenant} />}
          <Outlet context={{ setSidebarOpen, setRightAction }} />

          <BottomNav />
        </div>
      )
    }

    return (
      <DesktopSidebarLayout>
        <BusinessNameWarningBanner />
        {!isSuperadmin && <PlanExpiryBanner tenant={tenant} />}
        <Outlet context={{ setSidebarOpen, setRightAction }} />
      </DesktopSidebarLayout>
    )
  }

  return (
    <>
      {renderContent()}
      <InstallAppPrompt />
    </>
  )
}
