import React from 'react'
import { Navigate } from 'react-router-dom'

// Sembako pages
import SembakoBeranda from '../sembako_broker/Beranda'
import SembakoPenjualan from '../sembako_broker/Penjualan'
import SembakoLaporan from '../sembako_broker/Laporan'
import SembakoProduk from '../sembako_broker/Produk'
import SembakoGudang from '../sembako_broker/Gudang'
import SembakoTokoSupplier from '../sembako_broker/TokoSupplier'
import SembakoTokoSupplierDetail from '../sembako_broker/TokoSupplierDetail'
import SembakoAkun from '@/dashboard/_shared/pages/Akun'
import SembakoTimManajemenPage from '../sembako_broker/TimManajemenPage'
import SembakoRetur from '../sembako_broker/Retur'
import WelcomeOnlyOverlay from '@/dashboard/_shared/components/WelcomeOnlyOverlay'

export function BrokerPageRouter({ page }) {
  const pages = {
    beranda: <SembakoBeranda />,
    pos: <SembakoPenjualan />,
    penjualan: <SembakoPenjualan />,
    produk: <SembakoProduk />,
    inventori: <SembakoProduk />,
    gudang: <SembakoGudang />,
    'toko-supplier': <SembakoTokoSupplier />,
    'toko-supplier-detail': <SembakoTokoSupplierDetail />,
    retur: <SembakoRetur />,
    karyawan: <SembakoTimManajemenPage />,
    laporan: <SembakoLaporan />,
    akun: <SembakoAkun />,
    tim: <SembakoTimManajemenPage />
  }

  const component = pages[page]

  if (!component) {
    return <Navigate to="/beranda" replace />
  }

  if (page === 'beranda') {
    return (
      <>
        {component}
        <WelcomeOnlyOverlay accent="#EA580C" accentDim="rgba(234,88,12,0.12)" />
      </>
    )
  }

  return component
}
