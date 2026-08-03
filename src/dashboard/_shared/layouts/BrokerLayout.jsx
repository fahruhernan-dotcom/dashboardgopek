import React, { useState, useRef, useEffect, Component } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import AppSidebar from '../components/AppSidebar'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical } from '@/lib/businessModel'
import BusinessModelOverlay from '../components/BusinessModelOverlay'
import AIChatBubble from '@/dashboard/broker/ai/AIChatBubble'
import { useNotificationGenerator } from '@/lib/hooks/useNotifications.jsx'
import { useForceDarkMode } from '@/lib/hooks/useForceDarkMode'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BusinessNameWarningBanner } from '../components/BusinessNameWarningBanner'
import InstallAppPrompt from '@/components/InstallAppPrompt'
import { PlanExpiryBanner } from '../components/PlanExpiryBanner'
import { SidebarProvider } from '@/components/ui/sidebar'
import {
  useSembakoDashboardStats, useSembakoProducts,
  useSembakoSuppliers, useSembakoCustomers,
  useSembakoEmployees, useSembakoDeliveries, useSembakoSalesPendingDelivery,
} from '@/lib/hooks/useSembakoData'

// ── AI Error Boundary ─────────────────────────────────────────
// Isolates crash di AIChatBubble agar tidak merusak halaman utama
class AIErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }
  static getDerivedStateFromError() {
    return { crashed: true }
  }
  componentDidCatch(error) {
    console.error('[AIErrorBoundary] AI widget crashed:', error)
  }
  render() {
    if (this.state.crashed) {
      return (
        <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-[60] w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center" title="AI sementara tidak tersedia">
          <span className="text-red-400 text-lg">!</span>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Cache Warmers ─────────────────────────────────────────────
// Komponen ini mount bersama layout dan mengisi TanStack Query cache
// untuk semua halaman navigasi utama. Saat user buka halaman untuk
// pertama kali, data sudah ada di cache → langsung tampil tanpa skeleton.
// staleTime:5m di queryClient memastikan tidak ada re-fetch duplikat.
//
// AfterPaint: delays mounting children until after the first browser paint
// so the Beranda skeleton renders before the prefetch burst begins.
// Hooks rules are NOT violated — the early return is inside AfterPaint,
// and the prefetcher components (which own all useQuery calls) only mount
// once `ready` is true. Never put hooks after a conditional return.
function AfterPaint({ children, delay = 600 }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  if (!ready) return null
  return children
}

function SembakoPrefetcher() {
  // Heavy full-table-scan hooks removed to reduce Disk IO:
  //   useSembakoSales()      — all sales rows, no date window
  //   useSembakoAllBatches() — all stock batches, no date window
  //   useSembakoStockOut()   — all stock-out history, no date window
  // Those pages fetch their own data on-demand when the user navigates there.
  useSembakoDashboardStats()
  useSembakoProducts()
  useSembakoSuppliers()
  useSembakoCustomers()
  useSembakoEmployees()
  useSembakoDeliveries()
  useSembakoSalesPendingDelivery()
  return null
}

function PoultryBrokerPrefetcher() {
  const { tenant } = useAuth()
  const tid = tenant?.id

  // NOTE: ['sales', tid] prefetch intentionally removed.
  // The full sales fetch (7-level join, no date window) was causing a DB
  // connection spike on startup. Beranda.jsx owns dashboard sales data via
  // ['dashboard-redesign', tenant.id, province] with a 60-day window.
  // The Transaksi page fetches its own scoped sales list on demand.

  // Pengiriman page — 90-day window + row cap prevents full-history table scan
  useQuery({
    queryKey: ['deliveries', tid],
    queryFn: async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('deliveries')
        .select(`*, drivers(full_name), vehicles(brand,vehicle_plate), sales!inner(id,is_deleted,total_revenue,quantity,total_weight_kg,price_per_kg,delivery_cost,rpa_clients(rpa_name,phone),purchases(total_cost,transport_cost,other_cost,price_per_kg,farms(farm_name)))`)
        .eq('tenant_id', tid).eq('is_deleted', false).eq('sales.is_deleted', false)
        .gte('created_at', ninetyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(300)
      if (error) throw error
      return data
    },
    enabled: !!tid,
  })
  useQuery({
    queryKey: ['loss-reports', tid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loss_reports')
        .select(`*, delivery:deliveries(*,sales(price_per_kg,rpa_clients(rpa_name)))`)
        .eq('tenant_id', tid).eq('is_deleted', false)
        .order('report_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!tid,
  })

  // Armada page
  useQuery({
    queryKey: ['vehicles', tid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, deliveries(id,created_at,is_deleted)')
        .eq('tenant_id', tid).eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!tid,
  })
  useQuery({
    queryKey: ['drivers', tid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*, deliveries(id,created_at,is_deleted)')
        .eq('tenant_id', tid).eq('is_deleted', false)
        .order('full_name', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!tid,
  })

  return null
}

export default function BrokerLayout() {
  const { profile, tenant, loading, isSuperadmin, refetchProfile } = useAuth()
  useNotificationGenerator()
  useForceDarkMode()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const openHandler = () => setSidebarOpen(true)
    window.addEventListener('open-mobile-sidebar', openHandler)
    return () => window.removeEventListener('open-mobile-sidebar', openHandler)
  }, [])

  // Swipe-right-from-left-edge to open sidebar
  const swipeStartX = useRef(null)
  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    // Only trigger if swipe started within 40px of left edge and moved 60px+ right
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
      <div style={{ minHeight: '100vh', padding: 24, color: '#F1F5F9', background: '#06090F' }}>
        Memuat dashboard...
      </div>
    )
  }

  // Guard: Business Model Selection (Bypassed for Superadmin)
  if (!isSuperadmin && !profile?.business_model_selected) {
    return <BusinessModelOverlay profile={profile} onComplete={refetchProfile} />
  }

  const vertical = resolveBusinessVertical(profile, tenant)
  const isSembako = vertical === 'distributor_sembako' || vertical === 'sembako_broker'

  const renderContent = () => {
    if (!isDesktop) {
      return (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            background: '#06090F',
            minHeight: '100vh',
            maxWidth: '480px',
            margin: '0 auto',
            paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
            position: 'relative',
            overflowX: 'hidden',
            overscrollBehaviorX: 'none'
          }}
        >
          <SidebarProvider style={{ minHeight: 0 }}>
            <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </SidebarProvider>
          <BusinessNameWarningBanner />
          {!isSuperadmin && <PlanExpiryBanner tenant={tenant} />}
          <Outlet context={{ setSidebarOpen, setRightAction: () => {} }} />
          <BottomNav />
        </div>
      )
    }

    return (
      <DesktopSidebarLayout>
        <BusinessNameWarningBanner />
        {!isSuperadmin && <PlanExpiryBanner tenant={tenant} />}
        <Outlet context={{ setSidebarOpen }} />
      </DesktopSidebarLayout>
    )
  }

  return (
    <>
      {/* Prefetchers are delayed via AfterPaint so the first render frame
          (Beranda skeleton) paints before the cache-warm burst begins.
          AfterPaint is a separate component — hooks rules are not violated. */}
      {isSembako && (
        <AfterPaint delay={600}>
          <SembakoPrefetcher />
        </AfterPaint>
      )}
      {vertical === 'poultry_broker' && (
        <AfterPaint delay={600}>
          <PoultryBrokerPrefetcher />
        </AfterPaint>
      )}
      {renderContent()}
      <AIErrorBoundary><AIChatBubble /></AIErrorBoundary>
      <InstallAppPrompt />
    </>
  )
}
