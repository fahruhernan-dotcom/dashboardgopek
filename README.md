# 📦 GPK (Gopek) — Sembako & FMCG Broker Operating System

<div align="center">

![Version](https://img.shields.io/badge/version-0.9.7-emerald?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS_3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor_Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![Dexie](https://img.shields.io/badge/Dexie_IndexedDB-Offline_First-orange?style=for-the-badge)

**Sistem Operasi ERP, Point of Sale (POS), dan Business Intelligence Terintegrasi untuk Distributor, Agen Grosir, Pemasok, dan Broker Sembako / FMCG B2B.**

[Ringkasan](#-tentang-gpk-sembako-os) • [Fitur & Modul](#-fitur-utama--modul-aplikasi) • [Arsitektur Sistem](#-arsitektur-sistem--teknologi) • [Struktur Direktori](#-struktur-direktori-proyek) • [Panduan Instalasi](#-panduan-instalasi--pengembangan) • [Environment Variables](#-konfigurasi-environment-variables) • [Database & Migrasi SQL](#-database-schema--migrasi-postgresql) • [Offline Sync](#-mekanisme-offline-first--sinkronisasi) • [Mobile Build](#-build-aplikasi-mobile-android) • [Manajemen Versi & CI/CD](#-manajemen-versi--rilis-otomatis-cicd--github-artifacts) • [RBAC & Keamanan](#-keamanan--matriks-hak-akses-rbac)

</div>

---

## 📖 Tentang GPK Sembako OS

**GPK (Gopek Sembako OS)** adalah platform ERP dan POS modern yang dikembangkan secara spesifik untuk mengatasi kompleksitas operasional perdagangan sembako dan barang kebutuhan pokok di Indonesia.

### Permasalahan Bisnis yang Diselesaikan:
1. **Konversi Satuan Bertingkat yang Kompleks**: Perdagangan sembako melibatkan kemasan bertingkat (*Sak/Karung ➔ Dus/Karton ➔ Bal ➔ Renceng/Pak ➔ Pcs/Kg*). Sistem ini menyediakan dynamic unit conversions otomatis baik pada saat stok masuk, opname, maupun checkout kasir.
2. **Resiko Kerugian Akibat Barang Kadaluarsa (*Expired*)**: Pengurangan stok dilakukan berbasis **FIFO (First-In, First-Out) Atomik** pada level database untuk memprioritaskan batch stok tertua.
3. **Piutang Macet Toko Mitra (*Bad Debt*)**: Pelacakan batas limit kredit (*Credit Limit*), penagihan otomatis, umur piutang (*Aging Schedule*), dan pencatatan riwayat pembayaran cicilan per toko.
4. **Konektivitas Tidak Stabil di Gudang / Lapangan**: Arsitektur **Offline-First** berbasis Dexie.js (IndexedDB) memungkinkan transaksi kasir dan pengecekan data tetap berjalan normal saat koneksi internet terputus, dan otomatis disinkronkan kembali saat online.
5. **Kebutuhan Analisis Cepat & Fleksibel**: Asisten AI terintegrasi (**MAIA Router & Grok / GLM**) yang dapat menjawab analisis finansial dan mengeksekusi aksi transaksi secara instan via percakapan alami.

---

## 🌟 Fitur Utama & Modul Aplikasi

```
                       ┌──────────────────────────────────────┐
                       │        GPK Sembako OS Hub            │
                       └──────────────────┬───────────────────┘
         ┌──────────────────┬─────────────┼─────────────┬──────────────────┐
         │                  │             │             │                  │
    ┌────┴────┐        ┌────┴────┐   ┌────┴────┐   ┌────┴────┐        ┌────┴────┐
    │ Penjualan│        │ Gudang &│   │ CRM &   │   │Laporan &│        │   AI &  │
    │  & POS  │        │FIFO Batc│   │Hutang/Pi│   │Keuangan │        │MobileApp│
    └─────────┘        └─────────┘   └─────────┘   └─────────┘        └─────────┘
```

---

### 1. 📊 Beranda & Intelligence Hub
- **Executive KPI Strip**: Ringkasan omzet berjalan, laba kotor (*Gross Profit*), margin keuntungan (%), total piutang toko aktif, serta hutang supplier yang mendekati jatuh tempo.
- **Safety Stock Alert**: Peringatan otomatis untuk produk yang jumlah stok fisiknya berada di bawah batas minimum (*Reorder Point*).
- **Piutang Overdue Monitor**: Identifikasi instan toko-toko mitra yang telah melewati tanggal jatuh tempo pembayaran (*Overdue Invoices*).
- **Grafik Tren Interaktif**: Visualisasi fluktuasi omzet harian, arus kas (*Cashflow*), dan perbandingan profitabilitas antar periode.
- **Top Moving & High Margin Items**: Pemeringkatan produk terlaris dan produk dengan kontribusi margin terbesar.
- **Onboarding Checklist**: Panduan tahapan konfigurasi data awal (profil toko, tambah produk pertama, tambah mitra, input saldo awal).

---

### 2. 🛒 Point of Sale (POS) & Faktur Penjualan
- **Quick-Search & Barcode Scanner**: Pencarian kilat berdasarkan nama barang, SKU, barcode produk, atau pemindaian via kamera perangkat (`QRScannerModal`).
- **Multi-Satuan Dinamis**: Memungkinkan penjualan satuan eceran dari kemasan dus/karung secara otomatis (misal: beli 3 pcs dari stok kardus berisi 24 pcs).
- **Multi-Tier Pricing System**:
  - *Harga Eceran* (Umum/Walk-in customer)
  - *Harga Grosir 1* (Toko menengah)
  - *Harga Grosir 2* (Agen besar)
  - *Harga Langganan Khusus* (Diskon per mitra)
- **Metode Pembayaran Lengkap**:
  - **Tunai / Cash**: Input uang diterima dan hitung kembalian otomatis.
  - **Transfer Bank**: Konfirmasi nomor rekening dan bukti mutasi.
  - **Piutang / Tempo**: Penentuan tanggal jatuh tempo, DP (uang muka), dan pencatatan saldo sisa.
  - **Titipan / Giro**: Rekam nomor warkat dan tanggal efektif kliring.
- **Pencetakan & Pembagian Faktur**:
  - Cetak struk thermal 58mm/80mm (Bluetooth ESC-POS).
  - Ekspor faktur resmi berformat PDF lengkap dengan detail pajak, nomor seri faktur, dan QR verifikasi (`SembakoInvoicePreview`).
  - Fitur kirim faktur langsung ke WhatsApp toko mitra dengan template pesan profesional yang dapat disesuaikan.

---

### 3. 📦 Gudang & Manajemen Batch FIFO
- **Engine Stok FIFO Atomik**: Pengurangan stok saat penjualan memotong batch stok tertua secara otomatis di level database PostgreSQL untuk mencegah selisih dan race-condition.
- **Penerimaan Barang (*Stock In*)**: Input stok baru dari supplier lengkap dengan nomor batch internal, tanggal kadaluarsa, harga beli, dan alokasi biaya pengiriman (HPP bersih).
- **Penyesuaian Stok (*Stock Opname*)**: Modul audit fisik vs stok sistem dengan riwayat alasan penyesuaian (pecah/bocor, hilang, rusak, salah hitung).
- **Log Pergerakan Stok (*Stock Movement Audit Trail*)**: Pencatatan riwayat setiap unit barang masuk, keluar, retur, dan koreksi opname.
- **Peringatan Kadaluarsa (*Expiry Warning*)**: Notifikasi batch barang yang akan kadaluarsa dalam 30, 60, atau 90 hari ke depan.
- **Recycle Bin**: Tempat penampungan sementara data produk/batch yang terhapus untuk mencegah kehilangan data permanen akibat ketidaksengajaan.

---

### 4. 👥 CRM Toko Mitra & Supplier
- **Toko Mitra (Pelanggan B2B / Warung)**:
  - Profil lengkap: nama toko, pemilik, kontak WhatsApp, koordinat alamat, dan rute kurir.
  - Buku Besar Piutang (*Customer Ledger*): Riwayat seluruh faktur, pembayaran cicilan, dan sisa saldo belum terbayar.
  - Pengaturan *Credit Limit* (batas maksimum saldo piutang yang diizinkan).
  - Lembar Penagihan Piutang (*Payment Collection Sheet*).
- **Supplier (Pemasok / Principal)**:
  - Profil supplier, PIC, nomor rekening, dan riwayat Purchase Order (PO).
  - Buku Besar Hutang Dagang (*Accounts Payable*) dan pemantauan hutang jatuh tempo.
  - Daftar katalog harga pasokan per supplier untuk komparasi margin.

---

### 5. 🔄 Retur & Pengembalian Barang
- **Retur Penjualan (*Sales Return*)**: Penerimaan kembali barang rusak/cacat/salah kirim dari toko mitra.
- **Retur Pembelian (*Purchase Return*)**: Pengajuan klaim pengembalian barang rusak atau expired ke supplier/pabrik.
- **Metode Penyelesaian Retur Multi-Opsi**:
  1. *Ganti Barang / Tukar Stok Baru*
  2. *Potong Piutang Toko / Potong Hutang Supplier*
  3. *Pengembalian Uang Tunai (Cash Refund)*
- **Status Workflow Audit**: *Draft ➔ Diajukan ➔ Diterima Gudang ➔ Disetujui ➔ Selesai*.

---

### 6. 📈 Laporan Keuangan, Akuntansi & Analytics
- **Laporan Laba Rugi Komprehensif (P&L)**:
  - Pendapatan Penjualan Bersih
  - Harga Pokok Penjualan (HPP / COGS berbasis batch aktual)
  - Laba Kotor (*Gross Profit*)
  - Beban Operasional Usaha
  - Laba Bersih Operasional (*Net Operating Profit*)
- **Laporan Umur Piutang (*Accounts Receivable Aging*)**: Analisis klasifikasi umur tagihan:
  - Belum Jatuh Tempo (Current)
  - 1 – 15 Hari Terlambat
  - 16 – 30 Hari Terlambat
  - 31 – 60 Hari Terlambat
  - \> 60 Hari (Potensi Macet / High Risk)
- **Laporan Valuasi Nilai Aset Stok**: Total nilai uang persediaan barang yang mengendap di gudang.
- **Laporan Arus Kas (*Cash Flow Ledger*)**: Catatan mutasi kas masuk dan kas keluar operasional harian.
- **Ekspor Dokumen Laporan**:
  - Generator PDF Laporan Keuangan Resmi (`FinancialReportPdfModal`).
  - Ekspor file lembar kerja Spreadsheet (CSV / Excel).

---

### 7. 🚚 Manajemen Pengiriman & Kurir (Delivery & POD)
- **Penugasan Faktur ke Driver / Kurir**: Pengelompokan faktur penjualan berdasarkan area pengiriman dan armada kendaraan.
- **Pelacakan Status Pengiriman**: *Menunggu Diambil ➔ Dalam Perjalanan ➔ Terkirim ➔ Gagal Kirim*.
- **Proof of Delivery (POD)**: Pencatatan nama penerima barang, tanda tangan digital, serta unggah foto bukti serah terima barang.

---

### 8. 👥 SDM, Payroll & Manajemen Tim
- **Direktori Karyawan & Pembagian Hak Akses**: Manajemen staf dengan assign role (Owner, Admin, Kasir, Gudang, Driver).
- **Perhitungan Gaji & Insentif (Payroll)**: Gaji pokok, tunjangan makan/transport, komisi penjualan kurir, potongan kasbon karyawan, dan cetak slip gaji.
- **Audit Log Aktivitas**: Perekaman aktivitas login, pembatalan faktur, pengubahan harga, dan penyesuaian stok per akun pengguna.

---

### 9. 🤖 MAIA AI Business Assistant
- **AI Router Integration**: Terhubung ke endpoint MAIA Router dengan model utama **Grok xAI Fast Reasoning** dan fallback **GLM ZhipuAI**.
- **Context-Aware Knowledge**: AI membaca data stok real-time, status piutang, dan riwayat penjualan tenant untuk memberikan rekomendasi akurat.
- **Voice & Chat Assistant**:
  - *"Produk apa yang paling laris minggu ini dan berapa sisa stoknya di gudang?"*
  - *"Tampilkan toko yang memiliki piutang lebih dari Rp 5.000.000 dan sudah jatuh tempo."*
  - *"Buatkan draf pesanan pembelian Tepung Terigu 100 karung ke Supplier ABC."*

---

### 10. 🌐 Publik, Pasar & Portal Komoditas
- **Harga Pasar Public (`HargaPasarPublic.jsx`)**: Dashboard pantauan harga rata-rata komoditas sembako nasional/daerah (Beras, Minyak, Telur, Gula, Cabai, Bawang).
- **B2B Commodity Market (`MarketPublic.jsx`)**: Platform listing penawaran dan permintaan pasokan komoditas antar pedagang besar.
- **Portal Publik**: Halaman About Us, FAQ, Kebijakan Privasi, Syarat & Ketentuan, Keamanan Sistem, dan Form Kontak.

---

### 11. 🛡️ Multi-Tenant, Lisensi & Superadmin Hub
- **Isolasi Data Antar-Tenant**: Setiap distributor memiliki ruang data terisolasi menggunakan `tenant_id`.
- **Manajemen Lisensi & Kuota**: Paket langganan (Trial, Basic, Pro, Enterprise), kuota jumlah transaksi per bulan, limit jumlah produk, dan limit jumlah akun staf.
- **Proteksi Server Terkunci (`LockedServerPage`)**: Penguncian akses otomatis apabila masa aktif langganan telah berakhir, dengan opsi perpanjangan lisensi.
- **Dev / Superadmin Hub (`DevAdminHubPage`, `SuperadminDashboardPage`)**: Panel khusus developer untuk diagnosa sistem, simulasi akun, pengecekan log error, dan maintenance data.

---

## 🏗️ Arsitektur Sistem & Teknologi

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (SPA & PWA)                      │
│   React 19 • Vite 6 • TailwindCSS 3.4 • Radix UI • Framer Motion        │
│   Capacitor 8 (Native Android Wrapper) • Recharts • Sonner Toast        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
┌─────────────────────────────────┐   ┌───────────────────────────────────┐
│     OFFLINE LAYER (Dexie.js)     │   │     ONLINE API & CLOUD BACKEND    │
│  • IndexedDB Local Cache        │   │  • Supabase Client (PostgreSQL)   │
│  • Sync Queue (Push/Pull Engine)│   │  • Row-Level Security (RLS)       │
│  • Optimistic UI Updates        │   │  • Atomic SQL Functions (RPC)     │
└─────────────────────────────────┘   └─────────────────┬─────────────────┘
                                                        │
                                      ┌─────────────────┴─────────────────┐
                                      │       AI & EXTERNAL SERVICES      │
                                      │  • MAIA Router (Grok xAI / GLM)   │
                                      │  • WhatsApp API Connector         │
                                      └───────────────────────────────────┘
```

### Rincian Dependensi Utama

| Kategori | Paket / Library | Versi | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Core UI** | `react`, `react-dom` | `^19.2.4` | Core Library React terbaru |
| **Build Tool** | `vite` | `^6.4.2` | Bundler super cepat dengan HMR |
| **Routing** | `react-router-dom` | `^7.13.1` | Manajemen navigasi dan rute SPA |
| **Styling** | `tailwindcss`, `postcss` | `^3.4.19` | Utility-first CSS framework |
| **Primitif UI** | `@radix-ui/*` (15+ packages) | Latest | Komponen headless accessible (Dialog, Sheet, Popover, dll.) |
| **Animasi** | `framer-motion`, `tailwindcss-animate` | `^12.36.0` | Micro-interactions dan transisi halaman halus |
| **State & Data**| `@tanstack/react-query` | `^5.90.21` | Fetching, caching, background refetching server state |
| **Backend/DB**  | `@supabase/supabase-js` | `^2.105.1` | Supabase Postgres database client & authentication |
| **Offline DB**  | `dexie`, `dexie-react-hooks` | `^4.4.4` | IndexedDB client wrapper untuk mode offline-first |
| **Mobile Runtime** | `@capacitor/core`, `@capacitor/android` | `^8.5.0` | Native Android wrapper & bridge API |
| **Form & Validasi**| `react-hook-form`, `zod`, `@hookform/resolvers` | `^7.71.2` | Validasi skema formulir berperforma tinggi |
| **Visualisasi** | `recharts`, `@number-flow/react` | `^2.15.4` | Visualisasi grafik keuangan dan animasi angka |
| **Dokumen**     | `@react-pdf/renderer`, `qrcode` | `^4.5.1` | Pembuatan faktur/laporan PDF & QR Code nota |

---

## 📁 Struktur Direktori Proyek

```text
Dasboard Gopek/
├── .agents/                                # Konfigurasi skill dan aturan agent
├── android/                                # Native project Android Studio (Capacitor)
├── public/                                 # Static assets (logo, icon, favicon, manifest)
├── src/
│   ├── assets/                             # File gambar, ilustrasi, dan font
│   ├── components/                         # Komponen global yang dapat digunakan kembali
│   │   ├── license/                        # Banner lisensi & status subscription
│   │   ├── ui/                             # Komponen UI primitif shadcn / Radix
│   │   │   ├── alert-dialog.jsx            # Modal konfirmasi
│   │   │   ├── button.jsx                  # Tombol standar dengan varian
│   │   │   ├── dialog.jsx                  # Modal dialog
│   │   │   ├── dropdown-menu.jsx           # Menu drop-down
│   │   │   ├── sheet.jsx                   # Bottom sheet / slide-over panel
│   │   │   ├── sidebar.jsx                 # Navigasi sidebar
│   │   │   └── table.jsx                   # Tabel data responsif
│   │   ├── ErrorBoundary.jsx               # Penangkap error runtime tak terduga
│   │   └── LoadingScreen.jsx               # Layar animasi loading
│   ├── constants/                          # Konstanta tema, warna, dan lookup value
│   ├── dashboard/                          # Halaman & Tampilan Dashboard Bisnis
│   │   ├── _shared/                        # Modul dan tata letak bersama
│   │   │   ├── components/                 # AppSidebar, BottomNav, QRScannerModal, dll.
│   │   │   ├── layouts/                    # DesktopSidebarLayout, SuperadminLayout
│   │   │   └── pages/                      # Market, HargaPasar, BillingPortal, UpgradePlan, Akun
│   │   ├── broker/
│   │   │   └── sembako_broker/             # Modul Utama Distribusi Sembako
│   │   │       ├── Beranda.jsx             # Overview operasional, KPI, grafik omzet
│   │   │       ├── Penjualan.jsx           # POS kasir, input faktur, multi-satuan
│   │   │       ├── Produk.jsx              # Manajemen katalog, barcode, tier harga
│   │   │       ├── Gudang.jsx              # Stok FIFO, tambah batch, stock opname
│   │   │       ├── TokoSupplier.jsx        # Data pelanggan toko & supplier
│   │   │       ├── TokoSupplierDetail.jsx  # Buku besar transaksi & piutang per mitra
│   │   │       ├── Retur.jsx               # Retur jual/beli & klaim refund
│   │   │       ├── Laporan.jsx             # Laporan laba/rugi, valuasi stok, umur piutang
│   │   │       ├── Pegawai.jsx             # Penggajian (payroll) & penugasan kurir
│   │   │       ├── KelolaAkunPage.jsx      # Pengaturan cabang & profil tenant
│   │   │       ├── DevAdminHubPage.jsx     # Diagnostic tool & developer control center
│   │   │       ├── SembakoInvoicePreview.jsx # Tampilan cetak nota & kirim WhatsApp
│   │   │       └── components/             # Sub-komponen faktur, sheet, PDF exporter
│   │   └── superadmin/                     # Superadmin Dashboard Platform SaaS
│   │       └── SuperadminDashboardPage.jsx # Monitor multi-tenant & manajemen lisensi
│   ├── data/                               # Data statis & lookup awal
│   ├── hooks/                              # Custom React UI hooks (media queries, viewport)
│   ├── lib/                                # Core Engine, Service, & Backend Connector
│   │   ├── aiPrompt.js                     # System prompt & context injector AI
│   │   ├── aiService.js                    # HTTP client provider MAIA / Grok / GLM
│   │   ├── aiTransactionInserter.js        # Parser aksi transaksi dari respon AI
│   │   ├── auth/                           # Role checking & permission utilities
│   │   ├── format.js                       # Formatter Rupiah, tanggal, nomor WhatsApp
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx                 # Context Provider Supabase Authentication
│   │   │   └── sembako/                    # Custom Query & Mutation Hooks:
│   │   │       ├── sembakoSales.js         # Hook transaksi penjualan & kasir
│   │   │       ├── sembakoProducts.js      # Hook produk & konversi satuan
│   │   │       ├── sembakoBatches.js       # Hook stok batch FIFO gudang
│   │   │       ├── sembakoCustomers.js     # Hook toko mitra & piutang
│   │   │       ├── sembakoSuppliers.js     # Hook supplier & hutang
│   │   │       ├── sembakoReturns.js       # Hook retur barang & refund
│   │   │       ├── sembakoLaporan.js       # Hook agregasi laporan finansial
│   │   │       └── sembakoDeliveries.js    # Hook logistik & pengiriman kurir
│   │   ├── hpp/                            # Engine kalkulasi Harga Pokok Penjualan
│   │   ├── i18n/                           # Provider lokalisasi bahasa (ID/EN)
│   │   ├── invoice/                        # Engine generate nota thermal & PDF
│   │   ├── offline/                        # Offline-First Infrastructure:
│   │   │   ├── db.js                       # Skema Dexie.js (IndexedDB local store)
│   │   │   └── syncEngine.js               # Background push/pull sync worker
│   │   ├── queryClient.js                  # Konfigurasi TanStack Query Client
│   │   ├── subscriptionUtils.js            # Engine pengecekan masa aktif lisensi
│   │   └── supabase.js                     # Singleton Supabase Client Connection
│   ├── pages/                              # Public / Static Web Pages
│   │   ├── LandingPage.jsx                 # Landing page utama
│   │   ├── Login.jsx                       # Halaman masuk sistem
│   │   ├── Register.jsx                    # Pendaftaran akun tenant baru
│   │   ├── ForgotPassword.jsx              # Lupa kata sandi
│   │   ├── ResetPassword.jsx               # Reset kata sandi baru
│   │   ├── HargaPasarPublic.jsx            # Pantauan harga komoditas publik
│   │   ├── MarketPublic.jsx                # Marketplace B2B publik
│   │   ├── LockedServerPage.jsx            # Tampilan server terkunci (lisensi habis)
│   │   ├── AboutUs.jsx                     # Profil tentang perusahaan
│   │   ├── FAQPage.jsx                     # Tanya jawab umum
│   │   ├── PrivacyPage.jsx                 # Kebijakan privasi
│   │   ├── TermsPage.jsx                   # Syarat dan ketentuan
│   │   └── SecurityPage.jsx                # Informasi kepatuhan keamanan
│   ├── App.jsx                             # Master Route & Provider Orchestrator
│   ├── main.jsx                            # React Root Initializer
│   └── index.css                           # Global Tailwind Styles & Design Tokens
├── capacitor.config.json                   # Konfigurasi Capacitor Android App
├── package.json                            # Manifest dependensi & scripts
├── vite.config.js                          # Konfigurasi bundler Vite
└── *.sql                                   # File Migrasi Skema Database PostgreSQL
```

---

## 🚀 Panduan Instalasi & Pengembangan

### Prasyarat Perangkat Lunak
- **Node.js**: Versi `18.20.x` atau `20.x` LTS.
- **NPM**: Versi `9.x` atau lebih tinggi.
- **Database Supabase**: Proyek Supabase aktif dengan ekstensi PostgreSQL.
- **Android Studio** *(Opsional, untuk kompilasi APK Android)*: Versi Hedgehog atau lebih baru dengan Android SDK 34+.

### 1. Kloning Repositori
```bash
git clone <repository-url>
cd "Dasboard Gopek"
```

### 2. Pemasangan Dependensi
```bash
npm install
```

### 3. Konfigurasi File Lingkungan
Salin file contoh konfigurasi:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan nilainya (lihat bagian konfigurasi di bawah).

### 4. Menjalankan Server Lokal
```bash
npm run dev
```
Buka peramban di `http://localhost:5173`.

### 5. Memeriksa Kualitas Kode
```bash
npm run lint
```

---

## ⚙️ Konfigurasi Environment Variables

Berikut adalah daftar variabel lingkungan yang dibutuhkan pada file `.env`:

```env
# ─── 1. SUPABASE DATABASE & AUTH (WAJIB) ──────────────────────────────────
# URL Project Supabase Anda
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co

# Public Anonymous Key Supabase (Dapat diakses di Project Settings -> API)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ─── 2. AI ASSISTANT CONFIGURATION (MAIA ROUTER) ──────────────────────────
# API Key dari MAIA Router (https://maiarouter.ai)
VITE_MAIA_API_KEY=maia_sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Model AI utama yang digunakan (Wajib berawalan prefix xai/)
VITE_AI_MODEL=xai/grok-4-1-fast-reasoning-latest

# ─── 3. AI BACKUP PROVIDER (OPSIONAL) ─────────────────────────────────────
# API Key cadangan menggunakan model GLM dari ZhipuAI (jika MAIA unreachable)
VITE_GLM_API_KEY=your_glm_zhipuai_api_key_here

# ─── 4. INTEGRASI KOMUNIKASI & WHATSAPP ───────────────────────────────────
# Nomor WhatsApp Call Center / CS Default Distributor (Format: 628xxxxxxxxxx)
VITE_WHATSAPP_NUMBER=6281234567890
```

---

## 🗄️ Database Schema & Migrasi PostgreSQL

Aplikasi GPK menggunakan Supabase PostgreSQL dengan arsitektur multi-tenant. Seluruh skrip SQL telah dipersiapkan di root direktori.

### Deskripsi Skrip SQL:

| File SQL | Deskripsi & Fungsi |
| :--- | :--- |
| **`sembako_master_full_schema.sql`** | **Skema Master Lengkap**: Mendefinisikan seluruh tabel inti: `sembako_products`, `sembako_stock_batches`, `sembako_stock_outs`, `sembako_sales`, `sembako_sale_items`, `sembako_payments`, `sembako_customers`, `sembako_suppliers`, `sembako_returns`, `sembako_employees`, `sembako_payroll`, `sembako_audit_logs`, dan `sembako_tenants`. |
| **`create_sembako_sale_transaction.sql`** | **Fungsi Atomic RPC (`create_sembako_sale_transaction`)**: Eksekusi pembuatan faktur penjualan, kalkulasi HPP, dan pengurangan stok FIFO multi-batch dalam 1 transaksi database tunggal (ACID compliant). |
| **`fix_sembako_rls_policies.sql`** | **Kebijakan Row-Level Security (RLS)**: Mengunci seluruh operasi CRUD tabel agar hanya dapat diakses oleh user yang terautentikasi dan memiliki `tenant_id` yang sesuai. |
| **`fix_sembako_retur_refund_schema.sql`** | **Mesin Retur & Pengembalian**: Tabel, relasi, dan fungsi mutasi untuk retur barang, inspeksi fisik, dan pemotongan saldo hutang/piutang. |
| **`fix_sembako_deliveries_schema.sql`** | **Mesin Logistik & Pengiriman**: Tabel penugasan kurir, nomor resi pengiriman, bukti foto penerimaan barang, dan status DO. |
| **`fix_sembako_payroll_schema.sql`** | **Mesin Penggajian**: Tabel komponen gaji pokok, uang makan, insentif lembur/pengiriman, kasbon, dan slip gaji. |
| **`seed_demo_accounts.sql`** | **Data Demo**: Data awal produk sembako, toko mitra contoh, supplier contoh, dan transaksi demo. |

### Urutan Eksekusi di Supabase SQL Editor:
1. Jalankan `sembako_master_full_schema.sql`
2. Jalankan `create_sembako_sale_transaction.sql`
3. Jalankan `fix_sembako_rls_policies.sql`
4. Jalankan `fix_sembako_retur_refund_schema.sql`
5. Jalankan `fix_sembako_deliveries_schema.sql`
6. Jalankan `fix_sembako_payroll_schema.sql`
7. *(Opsional)* Jalankan `seed_demo_accounts.sql` untuk memuat data pengujian.

---

## ⚡ Mekanisme Offline-First & Sinkronisasi

Aplikasi dilengkapi mesin sinkronisasi cerdas menggunakan **Dexie.js (IndexedDB)**:

```
[ Aksi Pengguna (Kasir/Gudang) ]
               │
               ▼
   [ Cek Status Koneksi Internet ]
          ├── (Online)  ──► Eksekusi langsung ke Supabase API
          └── (Offline) ──► 1. Simpan ke IndexedDB lokal (Optimistic UI)
                            2. Masukkan mutasi ke tabel 'sync_queue'
                            3. Munculkan indikator "Menyimpan Offline"
               │
               ▼
[ Event: Koneksi Pulih (window.onOnline) ]
               │
               ▼
[ SyncEngine Auto-Flush ] ──► Mengirim antrian 'sync_queue' ke Supabase berurutan
```

1. **Pull Data Awal (`pullInitialData`)**: Mengunduh katalog produk, data pelanggan, supplier, dan faktur terakhir ke penyimpanan browser lokal saat pertama kali online.
2. **Push Antrian Offline (`syncNow`)**: Memproses seluruh transaksi tertunda di `sync_queue` secara otomatis begitu perangkat kembali terhubung ke internet.

---

## 📱 Build Aplikasi Mobile (Android)

GPK dapat dikemas menjadi aplikasi Android APK / AAB menggunakan **Capacitor 8**:

```
Web Code (React/Vite) ──[npm run build]──► /dist ──[npx cap sync android]──► Android Project ──► APK
```

### Langkah-langkah Build:

1. **Kompilasi Web Asset ke Direktori `/dist`**:
   ```bash
   npm run build
   ```

2. **Sinkronkan Asset Web ke Native Android Project**:
   ```bash
   npx cap sync android
   ```

3. **Buka Project di Android Studio**:
   ```bash
   npx cap open android
   ```

4. **Build APK Rilis**:
   - Di Android Studio, pilih menu **Build** ➔ **Generate Signed Bundle / APK...**
   - Pilih **APK** atau **Android App Bundle (AAB)** untuk publikasi ke Google Play Store.
   - Pilih Keystore sertifikat Anda dan tentukan varian build `release`.

---

## 🏷️ Manajemen Versi & Rilis Otomatis (CI/CD & GitHub Artifacts)

Project GPK dilengkapi sistem automasi versi menyeluruh yang menyinkronkan seluruh titik metadata dalam 1 perintah:

### 1. Perintah Bump Versi (Sekali Jalan)

Jalankan perintah berikut sebelum membuat rilis baru:

```bash
# Otomatis naikkan patch version (misal v0.9.5 ➔ v0.9.6) & set build number ke tanggal hari ini (YYYYMMDD)
npm run bump

# Naikkan minor version (misal v0.9.6 ➔ v0.10.0)
npm run bump minor

# Naikkan major version (misal v0.10.0 ➔ v1.0.0)
npm run bump major

# Custom version dan custom build number manual
npm run bump v1.0.1 20260817
```

Perintah di atas secara otomatis memperbarui 4 berkas sekaligus:
1. `src/dashboard/_shared/pages/akun_page/constants.js` (`APP_VERSION`, `APP_BUILD_NUMBER`, `APP_VERSION_LABEL`)
2. `package.json` (`version`)
3. `android/app/build.gradle` (`versionCode`, `versionName`)
4. `README.md` (Badge Version)

---

### 2. Penamaan ZIP Artifact di GitHub Actions

Setiap kali kode di-push ke branch `main`:
1. **GitHub Actions CI/CD** mengekstrak metadata versi dan tanggal build.
2. File ZIP artifact yang di-generate pada tab **Actions** otomatis diberi nama sesuai versi dan build:
   ```
   📦 GPK-APK-v0.9.6-b20260817.zip
   ```
   *(Tidak lagi bernama generik `GPK-APK.zip`, sehingga riwayat unduhan jelas dan teratur)*.

---

### 3. Otomatisasi Distribusi APK ke Supabase & In-App Auto-Update

Setelah proses build Android selesai di GitHub Actions Runner:
- File APK otomatis diunggah ke Supabase Storage bucket **`apk-releases`**:
  - `app-latest.apk` (pointer rilis terbaru untuk download instan)
  - `app-v0.9.6.apk` (arsip rilis permanen per versi)
- Record metadata dicatat ke tabel **`public.app_releases`** di PostgreSQL Supabase.
- Trigger database **`tr_notify_on_new_app_release`** secara instan mengirim notifikasi in-app realtime + push notification (FCM) kepada seluruh pengguna aktif bahwa versi terbaru telah tersedia untuk diperbarui.

---

## 🔐 Keamanan & Matriks Hak Akses (RBAC)

Sistem menerapkan prinsip **Least Privilege Access Control** untuk memastikan integritas data bisnis distributor:

| Fitur / Menu | Dev / Superadmin | Owner (Pemilik) | Admin Operasional | Kasir | Staff Gudang | Driver / Kurir |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Kelola Tenant & Lisensi SaaS** | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Dashboard Keuangan & Laba/Rugi**| ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Manajemen Penggajian (Payroll)** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Transaksi POS & Buat Faktur**   | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ |
| **Katalog Produk & Ubah Harga**   | ✅ Full | ✅ Full | ✅ Full | 👁️ Lihat Saja | 👁️ Lihat Saja | ❌ |
| **Penerimaan Stok Batch (In)**    | ✅ Full | ✅ Full | ✅ Full | ❌ | ✅ Full | ❌ |
| **Stock Opname & Penyesuaian**   | ✅ Full | ✅ Full | ✅ Full | ❌ | ✅ Full | ❌ |
| **CRM Toko Mitra & Limit Piutang**| ✅ Full | ✅ Full | ✅ Full | 👁️ Lihat Saja | ❌ | ❌ |
| **Buku Besar Supplier & Hutang**  | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Retur Penjualan & Pembelian**   | ✅ Full | ✅ Full | ✅ Full | ❌ | ✅ Full | ❌ |
| **Penugasan & Status Pengiriman** | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ✅ Update Status |
| **Akses Asisten MAIA AI**         | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ |

---

## 📋 Ringkasan Perintah (NPM Scripts)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan local development server Vite dengan hot module replacement |
| `npm run build` | Melakukan kompilasi produksi bundle aplikasi ke folder `/dist` |
| `npm run lint` | Menjalankan ESLint untuk pengecekan kualitas kode |
| `npm run preview` | Menjalankan preview server lokal dari hasil build `/dist` |
| `npx cap sync` | Menyalin asset web terbaru ke seluruh platform Capacitor |
| `npx cap sync android` | Menyalin asset web terbaru khusus ke platform Android |
| `npx cap open android` | Membuka folder platform Android di Android Studio |
| `npx cap run android` | Menjalankan aplikasi langsung ke device Android / Emulator |

---

## 👨‍💻 Kontribusi & Hak Cipta

Proyek ini dibangun dan dikelola secara profesional untuk standar industri distribusi FMCG dan Sembako di Indonesia.

- **Developer**: Tim Engineering GPK (Gopek Sembako OS)
- **Lisensi**: Proprietary & Commercial Software. Seluruh hak cipta dilindungi undang-undang.
