import React, { useEffect, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { TooltipProvider } from './components/ui/tooltip'
import { AuthProvider, useAuth } from './lib/hooks/useAuth'
import { LanguageProvider } from './lib/i18n/LanguageProvider'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from './dashboard/_shared/components/AppSidebar'
import DesktopSidebarLayout from './dashboard/_shared/layouts/DesktopSidebarLayout'
import BottomNav from './dashboard/_shared/components/BottomNav'
import { useMediaQuery } from './lib/hooks/useMediaQuery'
import { useForceDarkMode } from './lib/hooks/useForceDarkMode'

// Sembako Broker Pages
import SembakoBeranda from './dashboard/broker/sembako_broker/Beranda'
import SembakoPenjualan from './dashboard/broker/sembako_broker/Penjualan'
import SembakoProduk from './dashboard/broker/sembako_broker/Produk'
import SembakoGudang from './dashboard/broker/sembako_broker/Gudang'
import SembakoTokoSupplier from './dashboard/broker/sembako_broker/TokoSupplier'
import SembakoTokoSupplierDetail from './dashboard/broker/sembako_broker/TokoSupplierDetail'
import SembakoRetur from './dashboard/broker/sembako_broker/Retur'
import SembakoLaporan from './dashboard/broker/sembako_broker/Laporan'
import SembakoTimManajemenPage from './dashboard/broker/sembako_broker/TimManajemenPage'
import SembakoAkun from './dashboard/_shared/pages/Akun'
import SembakoTutorial from './dashboard/broker/sembako_broker/SembakoTutorial'

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function ProtectedRoute({ children }) {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen />
  return children
}

function SembakoLayout({ children }) {
  useForceDarkMode()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    const openHandler = () => setSidebarOpen(true)
    const toggleHandler = () => setSidebarOpen(prev => !prev)
    window.addEventListener('open-mobile-sidebar', openHandler)
    window.addEventListener('toggleMobileSidebar', toggleHandler)
    return () => {
      window.removeEventListener('open-mobile-sidebar', openHandler)
      window.removeEventListener('toggleMobileSidebar', toggleHandler)
    }
  }, [])

  if (isDesktop) {
    return (
      <DesktopSidebarLayout>
        {children}
        <SembakoTutorial />
      </DesktopSidebarLayout>
    )
  }

  return (
    <div className="bg-background min-h-screen w-full max-w-3xl mx-auto relative pb-[120px] shadow-2xl overflow-x-hidden">
      <SidebarProvider className="!min-h-0 !h-0 !w-0 !p-0 hidden">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </SidebarProvider>
      {children}
      <SembakoTutorial />
      <BottomNav />
    </div>
  )
}

function AppContentLayout() {
  const location = useLocation()

  return (
    <ErrorBoundary key={location.key}>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Sembako Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SembakoLayout>
                  <Routes>
                    {/* Direct Routes */}
                    <Route path="/" element={<SembakoBeranda />} />
                    <Route path="/beranda" element={<SembakoBeranda />} />
                    <Route path="/penjualan" element={<SembakoPenjualan />} />
                    <Route path="/pos" element={<SembakoPenjualan />} />
                    <Route path="/produk" element={<SembakoProduk />} />
                    <Route path="/inventori" element={<SembakoProduk />} />
                    <Route path="/gudang" element={<SembakoGudang />} />
                    <Route path="/toko-supplier" element={<SembakoTokoSupplier />} />
                    <Route path="/toko-supplier/:type/:id" element={<SembakoTokoSupplierDetail />} />
                    <Route path="/retur" element={<SembakoRetur />} />
                    <Route path="/laporan" element={<SembakoLaporan />} />
                    <Route path="/tim" element={<SembakoTimManajemenPage />} />
                    <Route path="/pegawai" element={<SembakoTimManajemenPage />} />
                    <Route path="/karyawan" element={<SembakoTimManajemenPage />} />
                    <Route path="/akun" element={<SembakoAkun />} />

                    {/* Broker Prefix Route Aliases (used by internal links) */}
                    <Route path="/broker/:brokerType/beranda" element={<SembakoBeranda />} />
                    <Route path="/broker/:brokerType/penjualan" element={<SembakoPenjualan />} />
                    <Route path="/broker/:brokerType/pos" element={<SembakoPenjualan />} />
                    <Route path="/broker/:brokerType/produk" element={<SembakoProduk />} />
                    <Route path="/broker/:brokerType/inventori" element={<SembakoProduk />} />
                    <Route path="/broker/:brokerType/gudang" element={<SembakoGudang />} />
                    <Route path="/broker/:brokerType/toko-supplier" element={<SembakoTokoSupplier />} />
                    <Route path="/broker/:brokerType/toko-supplier/:type/:id" element={<SembakoTokoSupplierDetail />} />
                    <Route path="/broker/:brokerType/retur" element={<SembakoRetur />} />
                    <Route path="/broker/:brokerType/laporan" element={<SembakoLaporan />} />
                    <Route path="/broker/:brokerType/tim" element={<SembakoTimManajemenPage />} />
                    <Route path="/broker/:brokerType/karyawan" element={<SembakoTimManajemenPage />} />
                    <Route path="/broker/:brokerType/akun" element={<SembakoAkun />} />

                    {/* Fallback redirect */}
                    <Route path="*" element={<Navigate to="/beranda" replace />} />
                  </Routes>
                </SembakoLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <ScrollToTop />
            <AppContentLayout />
          </TooltipProvider>
          <Toaster
            theme="dark"
            position="top-center"
            richColors
            expand={false}
            duration={3000}
            toastOptions={{
              style: {
                background: '#111C24',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#F1F5F9',
                fontFamily: 'DM Sans',
                fontSize: '14px',
                borderRadius: '12px',
                padding: '14px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
            }}
          />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
