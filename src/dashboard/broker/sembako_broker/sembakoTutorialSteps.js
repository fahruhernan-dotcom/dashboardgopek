import { Sparkles, ArrowLeftRight, Warehouse, Store, BarChart2 } from 'lucide-react'

export const SEMBAKO_STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Selamat datang di Broker Dashboard!',
    desc: 'Platform manajemen distributor sembako — buat invoice, kelola gudang, dan pantau pengiriman ke toko-toko Anda.',
    bullets: [
      'Invoice penjualan & pembayaran tercatat',
      'Stok gudang real-time per produk',
      'Laporan distribusi & piutang otomatis',
    ],
  },
  {
    id: 'penjualan',
    icon: ArrowLeftRight,
    title: 'Buat Invoice Penjualan',
    desc: 'Buat invoice untuk setiap penjualan ke toko atau pelanggan. Status pembayaran, jatuh tempo, dan sisa tagihan terpantau langsung.',
    navHint: 'Penjualan',
    selector: '[data-tutorial="sembako-penjualan"]',
  },
  {
    id: 'gudang',
    icon: Warehouse,
    title: 'Kelola Gudang & Stok',
    desc: 'Pantau stok setiap produk sembako di gudang Anda. Tambah stok masuk dari supplier, dan sistem otomatis kurangi saat penjualan.',
    navHint: 'Gudang',
    selector: '[data-tutorial="sembako-gudang"]',
  },
  {
    id: 'toko',
    icon: Store,
    title: 'Kelola Toko & Supplier',
    desc: 'Daftarkan toko pelanggan dan supplier barang. Data kontak, histori transaksi, dan limit kredit tersimpan per toko.',
    navHint: 'Toko & Supplier',
    selector: '[data-tutorial="sembako-toko"]',
  },
  {
    id: 'laporan',
    icon: BarChart2,
    title: 'Pantau Laporan & Distribusi',
    desc: 'Analisa penjualan per produk, piutang outstanding, dan efisiensi distribusi. Laporan siap cetak untuk rapat atau audit.',
    navHint: 'Laporan',
    selector: '[data-tutorial="sembako-laporan"]',
  },
]
