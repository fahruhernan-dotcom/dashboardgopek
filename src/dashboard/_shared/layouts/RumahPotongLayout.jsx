import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import AppSidebar from '../components/AppSidebar'
import { Menu } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationGenerator } from '@/lib/hooks/useNotifications.jsx'
import { useForceDarkMode } from '@/lib/hooks/useForceDarkMode'
import { BusinessNameWarningBanner } from '../components/BusinessNameWarningBanner'
import InstallAppPrompt from '@/components/InstallAppPrompt'
import { PlanExpiryBanner } from '../components/PlanExpiryBanner'
import { SidebarProvider } from '@/components/ui/sidebar'

/**
 * Common Layout for Rumah Potong (RPA/RPH)
 * Handles both Mobile (BottomNav + AppSidebar) and Desktop (DesktopSidebarLayout)
 */
export default function RumahPotongLayout() {
  const { _profile, loading, tenant, isSuperadmin } = useAuth()
  useNotificationGenerator()
  useForceDarkMode()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  // Visible loading state — must not return null while AppContentLayout's
  // overlay is between transitions, otherwise root renders only <Toaster />.
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', padding: 24, color: '#F1F5F9', background: '#06090F' }}>
        Memuat dashboard...
      </div>
    )
  }

  const renderContent = () => {
    if (!isDesktop) {
      return (
        <div style={{
          background: '#06090F',
          minHeight: '100vh',
          maxWidth: '480px',
          margin: '0 auto',
          paddingBottom: '80px',
          position: 'relative',
          overflowX: 'hidden',
          overscrollBehaviorX: 'none'
        }}>
          <button
            className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#0C1319] border border-white/10 rounded-xl flex items-center justify-center shadow-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-[#94A3B8]" />
          </button>
          
          <SidebarProvider style={{ minHeight: 0 }}>
            <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </SidebarProvider>
          <BusinessNameWarningBanner />
          {!isSuperadmin && <PlanExpiryBanner tenant={tenant} />}
          <Outlet />

          <BottomNav />
        </div>
      )
    }

    return (
      <DesktopSidebarLayout>
        <BusinessNameWarningBanner />
        {!isSuperadmin && <PlanExpiryBanner tenant={tenant} />}
        <Outlet />
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
