import {
  ArrowLeftRight, Home, Truck, Users, BarChart2, Package,
  ShoppingCart, UserCheck, FileText, RefreshCw, ClipboardList,
  TrendingUp, ShoppingBag, CreditCard, Building, Network, Zap, Shield, Bot, Milk
} from 'lucide-react'

/**
 * MASTER CONFIGURATION FOR TERNAK OS SUB-ROLES
 * This is the single source of truth for:
 * 1. Role identifiers
 * 2. Hero sections
 * 3. Feature lists (Starter, Pro, Business)
 * 4. FAQ entries
 * 5. Before/After comparisons
 */

export const BUSINESS_ROLES = [
  { id: 'broker', label: 'Broker', emoji: '🐔', description: 'Solusi untuk pengepul, agen, dan distributor.' },
  { id: 'peternak', label: 'Peternak', emoji: '🏠', description: 'Solusi untuk peternak mandiri dan kemitraan.' },
  { id: 'rpa', label: 'RPA', emoji: '🏭', description: 'Solusi untuk Rumah Potong Ayam dan RPH.' },
]

export const SUB_ROLES = {
  broker: [
    { id: 'ayam', label: 'Broker Ayam', disabled: false },
    { id: 'telur', label: 'Broker Telur', disabled: false },
    { id: 'sembako', label: 'Distributor Sembako', disabled: false },
    { id: 'daging', label: 'Distributor Daging', disabled: false },
  ],
  peternak: [
    { id: 'broiler', label: 'Ayam Broiler', disabled: false },
    { id: 'domba_penggemukan', label: 'Penggemukan Domba', disabled: false },
    { id: 'domba_breeding', label: 'Breeding Domba', disabled: false },
    { id: 'kambing_penggemukan', label: 'Penggemukan Kambing', disabled: false },
    { id: 'kambing_breeding', label: 'Breeding Kambing', disabled: false },
    { id: 'kambing_perah', label: 'Kambing Perah', disabled: false },
    { id: 'sapi', label: 'Sapi (Coming Soon)', disabled: false },
    { id: 'petelur', label: 'Ayam Petelur', disabled: true },
  ],
  rpa: [
    { id: 'buyer', label: 'Rumah Potong Ayam', disabled: false },
    { id: 'rph', label: 'RPH', disabled: true },
  ],
}

/**
 * CONFIGS PER SUB-ROLE
 * Scalable structure allowing unique content per sub-role.
 */
export const SUB_ROLE_CONFIGS = {
  broker_ayam: {
    hero: {
      eyebrow: 'Solusi Broker Ayam',
      headline: 'Kelola Ratusan Ton Ayam Tanpa Pusing Selisih Timbangan.',
      sub: 'Dari catat pembelian kandang sampai kirim nota ke WhatsApp pembeli — semua dalam 3 langkah.',
      cta: 'Mulai Kelola Transaksi Broker',
    },
    features: {
      starter: [
        'Input transaksi harian',
        'Laporan harian dasar',
        'Manajemen 1 armada/sopir',
        'Harga pasar realtime',
        'Akses mobile dashboard',
      ],
      pro: [
        'Transaksi beli & jual unlimited',
        'Manajemen kandang unlimited',
        'Tracking pengiriman & loss report',
        'RPA & piutang management',
        'Cash flow & laporan keuangan',
        'Armada kendaraan & sopir',
        'Tim maks 3 anggota',
        'TernakOS Market access',
      ],
      business: [
        'TernakBot AI (Grok 4.1 Fast)',
        'Analisis profit otomatis',
        'Deteksi anomali transaksi',
        'Prediksi margin AI',
        'Laporan PDF/Excel otomatis',
        'Tim unlimited',
        'Priority support',
      ],
    },
    groups: [
      {
        Icon: ArrowLeftRight,
        title: 'Catat Beli & Jual dalam Hitungan Detik',
        desc: 'Wizard transaksi 3 langkah — dari beli kandang sampai kirim ke RPA.',
        features: [
          'Catat pembelian dari kandang (harga, bobot, ekor)',
          'Catat penjualan ke RPA/pasar/langsung',
          'Kalkulasi margin otomatis per transaksi',
          'Multi-mode: Beli dulu atau Order dulu',
          'Riwayat transaksi lengkap dengan filter',
        ],
      },
      {
        Icon: Home,
        title: 'Pantau Semua Kandang dari Satu Tempat',
        features: [
          'Database kandang lengkap (stok, bobot, status)',
          'Rating kualitas kandang 1–5 bintang',
          'Filter kandang siap panen vs growing',
          'Riwayat transaksi per kandang',
          'Estimasi panen & jadwal harvest',
        ],
      },
      {
        Icon: Truck,
        title: 'Tracking Pengiriman Real-time',
        features: [
          'Catat detail pengiriman (kendaraan, sopir, muatan)',
          'Timbangan digital (Business plan)',
          'Catat bobot tiba vs bobot kirim (susut)',
          'Loss report otomatis: mortalitas & susut berat',
          'Revenue diupdate otomatis dari bobot tiba',
        ],
      },
      {
        Icon: Users,
        title: 'Kelola Piutang Tanpa Dispute',
        features: [
          'Database RPA/buyer lengkap',
          'Tracking piutang per RPA realtime',
          'Payment terms: Cash, NET 3/7/14/30',
          'Catat pembayaran partial',
          'Alert piutang jatuh tempo',
          'Reliability score per buyer',
        ],
      },
      {
        Icon: BarChart2,
        title: 'Laporan Keuangan Otomatis',
        features: [
          'Dashboard cash flow bulanan',
          'Breakdown: modal, transport, kerugian, extra',
          'Net profit per periode',
          'Grafik trend 6 bulan',
          'Catat biaya operasional tambahan',
        ],
      },
      {
        Icon: Truck,
        title: 'Kelola Armada & Anggota Tim',
        features: [
          'Database kendaraan + SIM expiry alert',
          'Database sopir + upah per trip',
          'Multi-role: Owner, Staff, View Only, Sopir',
          'Undang anggota via kode 6 digit',
          'RBAC: akses berbeda per role',
        ],
      },
    ],
    beforeAfter: [
      { before: 'Catat timbangan di buku, sering hilang atau salah', after: 'Input digital, tersimpan otomatis di cloud' },
      { before: 'Hitung margin manual pakai kalkulator', after: 'Margin terhitung otomatis per transaksi' },
      { before: 'Kirim nota lewat foto buku ke WhatsApp', after: 'Nota digital dikirim otomatis ke WhatsApp pembeli' },
      { before: 'Tidak tahu siapa yang belum bayar tempo', after: 'Dashboard piutang real-time dengan alert jatuh tempo' },
    ],
    faq: [
      { q: 'Apa itu aplikasi broker ayam dan apa bedanya dengan catatan biasa?', a: 'Aplikasi broker ayam adalah sistem digital untuk mencatat pembelian dari kandang, penjualan ke RPA/pasar, pengiriman, dan piutang dalam satu platform.' },
      { q: 'Bagaimana cara menghitung margin keuntungan broker ayam secara otomatis?', a: 'TernakOS menghitung margin otomatis: Margin = Harga Jual per kg × Bobot Tiba − (Modal Beli + Biaya Kirim + Biaya Lain).' },
      { q: 'Bagaimana cara melacak piutang broker ayam yang belum dibayar?', a: 'Dashboard RPA menampilkan total piutang per pembeli secara real-time. Kamu bisa lihat detail per transaksi.' },
    ]
  },

  broker_telur: {
    hero: {
      eyebrow: 'Solusi Broker Telur',
      headline: 'Pantau Harga Telur Harian dan Margin Per Transaksi Secara Real-time.',
      sub: 'Tidak ada lagi selisih hitungan. Semua tercatat otomatis dari kandang sampai pembeli.',
      cta: 'Coba Manajemen Broker Telur',
    },
    features: {
      starter: [
        'POS penjualan telur dasar',
        'Stok 1 grade telur',
        'Laporan harian dasar',
        'Akses mobile dashboard',
      ],
      pro: [
        'POS penjualan telur unlimited',
        'Inventori 3 grade (Hero/Standard/Salted)',
        'Database supplier & customer',
        'Tracking piutang customer',
        'Log mutasi stok (masuk/keluar/adj)',
        'Laporan penjualan & margin',
        'Tim maks 3 anggota',
        'TernakOS Market access',
      ],
      business: [
        'TernakBot AI',
        'Analisis top customer AI',
        'Prediksi stok otomatis',
        'Laporan PDF/Excel otomatis',
        'Tim unlimited',
        'Priority support',
      ],
    },
    groups: [
      {
        Icon: ShoppingCart,
        title: 'POS Telur yang Cepat & Akurat',
        features: [
          'Input penjualan per produk/grade',
          'Kalkulasi otomatis total + HPP',
          'Invoice number otomatis',
          'Status: Lunas / Piutang / Pending',
          'Customer name untuk quick search',
        ],
      },
      {
        Icon: Package,
        title: 'Stok Realtime per Grade Telur',
        features: [
          '3 grade: Hero, Standard, Salted',
          'Stok butir realtime',
          'HPP per butir + biaya packaging',
          'Harga jual per pack',
          'Alert stok menipis',
          'Log mutasi stok (masuk/keluar/adj)',
        ],
      },
      {
        Icon: UserCheck,
        title: 'CRM Supplier & Pelanggan',
        features: [
          'Database supplier lengkap',
          'Database customer dengan total spend',
          'Tracking order per customer',
          'Piutang customer terpantau',
        ],
      },
      {
        Icon: FileText,
        title: 'Histori & Laporan Penjualan',
        features: [
          'Riwayat semua transaksi',
          'Filter status fulfillment',
          'Net profit per invoice',
          'Top customer by revenue',
        ],
      },
    ],
    beforeAfter: [
      { before: 'Harga telur dicatat manual tiap hari', after: 'Pantau harga pasar real-time dari dashboard' },
      { before: 'Margin per transaksi dihitung kalkulator', after: 'Margin otomatis terhitung saat input transaksi' },
      { before: 'Piutang diingat-ingat sendiri', after: 'Tracking piutang otomatis dengan reminder' },
    ],
    faq: [
      { q: 'Bisakah kelola beberapa grade telur sekaligus?', a: 'Bisa. TernakOS mendukung multi-grade: Hero, Standard, dan Salted.' },
      { q: 'Bagaimana cara tracking piutang pelanggan telur?', a: 'Setiap transaksi dengan status "Piutang" otomatis masuk ke dashboard piutang per customer.' },
    ]
  },

  broker_sembako: {
    hero: {
      eyebrow: 'Solusi Agen Sembako',
      headline: 'Stok Bocor? Pantau Keluar Masuk Barang Secara Akurat dengan Sistem FIFO.',
      sub: 'Kelola ribuan item sembako — beras, minyak, telur — dalam satu invoice tanpa salah hitung.',
      cta: 'Coba Manajemen Stok Sembako',
    },
    features: {
      starter: [
        'Input transaksi harian',
        'Stok 50 item pertama',
        'Laporan harian dasar',
        'Akses mobile dashboard',
      ],
      pro: [
        'POS penjualan ritel & grosir unlimited',
        'Multi-gudang & multi-harga',
        'Database supplier & warung/toko',
        'Tracking piutang & tagihan',
        'Manajemen stok otomatis',
        'Cash flow & laporan laba/rugi',
        'TernakOS Market access',
      ],
      business: [
        'TernakBot AI (Grok 4.1 Fast)',
        'Analisis produk terlaris AI',
        'Prediksi restock otomatis via AI',
        'Broadcast WA tagihan otomatis',
        'Tim unlimited',
        'Priority support',
      ],
    },
    groups: [
      {
        Icon: ShoppingCart,
        title: 'POS Grosir & Eceran Dinamis',
        features: [
          'Support multi-satuan (Sak, Ball, Karton, Pcs)',
          'Invoice instan ke kasir & print struck',
          'Dual-Pricing otomatis (Harga Retail vs Partai)',
          'Sistem Payment Cash / Tempo (Piutang)',
          'Diskon dinamis (Tiered Pricing)'
        ],
      },
      {
        Icon: Package,
        title: 'Manajamen Multi-Gudang & Inventori',
        features: [
          'Tracking stok real-time antar cabang',
          'Mutasi/transfer stok antar gudang tanpa error',
          'Modul Stok Opname / SO harian terintegrasi',
          'Alert "Minimum Stock" ke HP pengelola',
          'Kalkulasi Harga Pokok Penjualan (HPP FIFO/Average)'
        ],
      },
      {
        Icon: Users,
        title: 'Kas & Hutang Piutang Lintas Toko',
        features: [
          'Monitor batas limit kredit toko mitra',
          'Rekap pencairan Nota Piutang / Bon',
          'Split-payment system untuk Sales Canvaser',
          'Monitoring komisi per divisi Sales',
          'Bukti pelunasan digital tanpa kertas'
        ],
      },
      {
        Icon: Network,
        title: 'Sentralisasi Jaringan Distribusi',
        features: [
          'Konsolidasi laporan performa seluruh agen cabang',
          'Sinkronisasi master data barang di semua P.O.S',
          'Analitik Pareto — Produk mana yang paling laris?',
          'Export Laporan Pemasukan Harian'
        ],
      },
    ],
    beforeAfter: [
      { before: 'Stok dicatat manual, sering selisih', after: 'FIFO otomatis, stok selalu akurat' },
      { before: 'Tidak tahu barang mana yang mau expired', after: 'Sistem batch tracking mencegah stok mengendap' },
      { before: 'Hitung untung rugi di akhir bulan saja', after: 'Laporan profit bersih tersedia kapan saja' },
    ],
    faq: [
      { q: 'Apa itu sistem FIFO dan kenapa penting untuk toko sembako?', a: 'FIFO (First In First Out) artinya barang yang masuk lebih dulu harus keluar lebih dulu.' },
      { q: 'Bisakah TernakOS dipakai untuk distributor sembako berskala besar?', a: 'Bisa. Paket Business mendukung unlimited pengguna, multi-gudang, dan konsolidasi laporan.' },
    ]
  },

  peternak_broiler: {
    hero: {
      eyebrow: 'Solusi Peternak Mandiri',
      headline: 'Cetak Indeks Performa (IP) Tertinggi dengan Manajemen Kandang Berbasis Data.',
      sub: 'Catat FCR, mortality, dan pemakaian obat harian. Bandingkan performa antar siklus kandang.',
      cta: 'Mulai Kelola Kandang Saya',
    },
    features: {
      starter: [
        '1 kandang aktif',
        '1 jenis ternak',
        'Input harian & laporan dasar',
        'FCR & IP Score tracking',
        'Akses mobile dashboard',
      ],
      pro: [
        '2 kandang aktif',
        '1 jenis ternak included',
        'Siklus pemeliharaan unlimited',
        'Input harian & laporan lengkap',
        'FCR & IP Score otomatis',
        'Export laporan PDF',
        'Prediksi panen AI dasar',
        'TernakOS Market access',
      ],
      business: [
        'Kandang unlimited',
        'Semua jenis ternak unlimited',
        'TernakBot AI included',
        'Export PDF/Excel',
        'Tim unlimited',
        'Priority support',
      ],
    },
    groups: [
      {
        Icon: Home,
        title: 'Multi-Kandang, Multi-Model Bisnis',
        features: [
          'Dukung Mandiri & Kemitraan (CP, Japfa, dll)',
          'Setup detail INTI perusahaan + harga kontrak',
          'Limit kandang per plan',
          'Multiple livestock type (Broiler, Petelur — roadmap)',
        ],
      },
      {
        Icon: RefreshCw,
        title: 'Tracking Siklus dari Chick In sampai Panen',
        features: [
          'Mulai siklus: input DOC, tanggal, target panen',
          'Catat biaya DOC otomatis (mandiri)',
          'Estimasi harvest date otomatis',
          'Status siklus: Growing, Ready, Panen, Selesai',
          'Multi-siklus paralel per kandang',
        ],
      },
      {
        Icon: ClipboardList,
        title: 'Input Harian < 2 Menit',
        features: [
          'Catat mortalitas harian',
          'Catat pakan terpakai (kg)',
          'Sample berat rata-rata (gram)',
          'FCR estimasi realtime',
          'Alert jika belum input hari ini',
          'Timeline histori per siklus',
        ],
      },
      {
        Icon: TrendingUp,
        title: 'Analitik Performa Kandang',
        features: [
          'FCR Final = total pakan ÷ total bobot panen',
          'IP Score otomatis per siklus',
          'Benchmark: Sangat Baik / Baik / Perlu Evaluasi',
          'Grafik bobot & pakan per hari',
          'Breakdown biaya lengkap per siklus',
          'HPP per kg terhitung otomatis',
        ],
      },
      {
        Icon: Users,
        title: 'Kelola Anak Kandang & Penggajian',
        features: [
          'Database anak kandang per farm',
          'Sistem gaji: Flat + Bonus panen',
          'Bonus otomatis jika FCR < target',
          'Catat pembayaran gaji & bonus',
          'Riwayat pembayaran per worker',
        ],
      },
      {
        Icon: Package,
        title: 'Manajemen Stok Pakan',
        features: [
          'Stok per jenis pakan (Starter/Grower/Finisher)',
          'Status: Aman / Cukup / Menipis',
          'Catat pembelian pakan (tambah stok)',
          'Catat pemakaian manual',
          'Alert stok < 100 kg',
          'Integrasi ke cycle_expenses',
        ],
      },
    ],
    beforeAfter: [
      { before: 'Catat kematian ayam di kertas, mudah hilang', after: 'Recording harian digital, tersimpan per siklus' },
      { before: 'Hitung FCR manual, sering tidak akurat', after: 'Kalkulator FCR otomatis dari data pakan & bobot' },
      { before: 'Tidak bisa bandingkan performa antar siklus', after: 'Analisis siklus otomatis dengan grafik tren' },
      { before: 'Tidak tahu profit sebelum panen selesai', after: 'Estimasi keuntungan tersedia real-time' },
    ],
    faq: [
      { q: 'Apa itu FCR dan kenapa penting untuk peternak ayam broiler?', a: 'FCR (Feed Conversion Ratio) adalah rasio kg pakan yang dibutuhkan untuk menghasilkan 1 kg bobot ayam.' },
      { q: 'Apakah TernakOS mendukung sistem kemitraan (CP, Japfa, dll)?', a: 'Ya. TernakOS mendukung model bisnis mandiri murni, mandiri semi, maupun mitra penuh.' },
      { q: 'Apakah ada fitur recording harian untuk peternak?', a: 'Ada. Input harian bisa diselesaikan kurang dari 2 menit: mortalitas, pakan terpakai, sampel bobot rata-rata.' },
    ]
  },

  rpa_buyer: {
    hero: {
      eyebrow: 'Solusi Rumah Potong Ayam',
      headline: 'Kelola Pembelian Ayam Hidup dan Pengiriman ke Pembeli Tanpa Dokumen Manual.',
      sub: 'Timbang, potong, kirim — semua tercatat digital dengan laporan harian otomatis.',
      cta: 'Kelola Operasional RPA',
    },
    features: {
      starter: [
        'Input harian operasional',
        'Laporan stok dasar',
        'Manajemen 1 unit RPA',
        'Harga pasar realtime',
        'Akses mobile dashboard',
      ],
      pro: [
        'Order ke broker unlimited',
        'Tracking hutang & pembayaran',
        'Laporan margin per produk',
        'Top customer analytics',
        'Profil bisnis RPA lengkap',
        'TernakOS Market access',
        'Tim maks 3 anggota',
        'Support via WhatsApp',
      ],
      business: [
        'TernakBot AI',
        'Prediksi permintaan AI',
        'Laporan PDF/Excel otomatis',
        'Tim unlimited',
        'Priority support',
      ],
    },
    groups: [
      {
        Icon: ShoppingBag,
        title: 'Kelola Order dari Broker',
        features: [
          'Buat order ke broker with spesifikasi lengkap',
          'Tracking status order',
          'Histori semua order',
          'Filter per status & periode',
        ],
      },
      {
        Icon: CreditCard,
        title: 'Tracking Hutang Transparan',
        features: [
          'Total hutang ke semua broker realtime',
          'Breakdown per broker + per transaksi',
          'Catat pembayaran (cash/transfer/giro)',
          '0 dispute dengan broker karena data sama',
          'History pembayaran lengkap',
        ],
      },
      {
        Icon: BarChart2,
        title: 'Analitik Profitabilitas',
        features: [
          'Margin per produk & per customer',
          'Top 10 customer by revenue',
          'Composed chart: Revenue + HPP + Profit',
          'Filter date range fleksibel',
          'Identifikasi produk paling profitable',
        ],
      },
      {
        Icon: Building,
        title: 'Profil & Preferensi Bisnis',
        features: [
          'Setup tipe RPA (potong ayam, pasar, restoran, dll)',
          'Kapasitas harian',
          'Payment terms default',
          'Preferred chicken type',
        ],
      },
    ],
    beforeAfter: [
      { before: 'Dokumen timbang manual, rawan dispute', after: 'Timbangan digital tercatat otomatis' },
      { before: 'Susut bobot tidak terpantau', after: 'Loss report otomatis setiap pengiriman' },
      { before: 'Laporan harian dibuat manual', after: 'Dashboard operasional harian otomatis' },
      { before: 'Koordinasi sopir lewat telepon', after: 'Manajemen armada & jadwal dari dashboard' },
    ],
    faq: [
      { q: 'Bagaimana TernakOS membantu mengurangi dispute dengan broker?', a: 'Data transaksi di TernakOS tercatat transparan untuk semua pihak.' },
      { q: 'Apakah ada laporan margin keuntungan per produk di RPA?', a: 'Ada. Laporan profitabilitas menampilkan margin per produk, top customer by revenue, dan grafik Revenue vs HPP vs Profit.' },
    ]
  },
  
  peternak_kambing_perah: {
    hero: {
      eyebrow: 'Solusi Kambing Perah',
      headline: 'Monitor Produksi Susu Harian & Kualitas Laktasi dalam Satu Genggaman.',
      sub: 'Pantau volume per ekor, jadwal perah, dan grafik penjualan susu secara otomatis.',
      cta: 'Coba Manajemen Kambing Perah',
    },
    features: {
      starter: [
        '10 ekor kambing laktasi',
        'Log produksi harian harian',
        'Laporan produksi dasar',
        'Akses mobile dashboard',
      ],
      pro: [
        'Ternak laktasi unlimited',
        'Log kualitas susu (Fat/SNF)',
        'Tracking reproduksi & breeding',
        'Inventori pakan & kesehatan',
        'Laporan laba/rugi per ekor',
        'Tim maks 3 anggota',
        'TernakOS Market access',
      ],
      business: [
        'TernakBot AI',
        'Analisis kurva laktasi AI',
        'Prediksi masa kering otomatis',
        'Laporan PDF/Excel otomatis',
        'Tim unlimited',
        'Priority support',
      ],
    },
    groups: [
      {
        Icon: Milk,
        title: 'Recording Produksi Susu Presisi',
        features: [
          'Log volume per sesi (Pagi/Sore)',
          'Recording per individu ear-tag',
          'Input parameter kualitas (Fat, SNF, Grade)',
          'Grafik kurva laktasi otomatis',
          'Total produksi harian & bulanan',
        ],
      },
      {
        Icon: RefreshCw,
        title: 'Manajemen Masa Kering & Laktasi',
        features: [
          'Alert jadwal pengeringan (Dry-off)',
          'Status laktasi real-time',
          'Tracking hari laktasi (DIM - Days in Milk)',
          'Prediksi puncak produksi',
        ],
      },
    ],
    beforeAfter: [
      { before: 'Volume susu dicatat di papan tulis, susah direkap', after: 'Data volume tersimpan per individu, rekap instan' },
      { before: 'Lupa kapan kambing harus dikeringkan', after: 'Reminder otomatis jadwal Dry-off dan Partus' },
      { before: 'Tidak tahu kambing mana yang paling produktif', after: 'Ranking kambing berdasarkan total yield laktasi' },
    ],
    faq: [
      { q: 'Apakah bisa mencatat kualitas susu seperti kadar lemak?', a: 'Bisa. Di paket Pro, kamu bisa mencatat Fat%, SNF%, dan kualitas grade susu.' },
      { q: 'Apakah sistem ini terhubung dengan modul breeding?', a: 'Ya. Modul perah terintegrasi penuh dengan siklus reproduksi (mating & partus).' },
    ]
  },
}

export const SHARED_GLOBAL_FEATURES = [
  {
    emoji: '🤖',
    Icon: Bot,
    title: 'TernakBot AI Assistant',
    desc: 'Asisten AI cerdas untuk analisis data. Tanya "Siapa pembeli nunggak?" atau "Gimana sales bulan ini?" dan sistem merangkum otomatis.',
  },
  {
    emoji: '📈',
    Icon: Zap,
    title: 'Dashboard Analisis Real-time',
    desc: 'Lacak matrik penting bisnis melalui grafik dan rangkuman cash flow komprehensif, disajikan instan.',
  },
  {
    emoji: '🔐',
    Icon: Shield,
    title: 'Role-Based Access (Multi-Role Tim)',
    desc: 'Undang karyawan (Supir/Staff/Admin) via kode 6-digit dengan fungsi & batasan menu spesifik.',
  },
  {
    emoji: '🛡️',
    Icon: Shield,
    title: 'Keamanan Data Bank-Grade',
    desc: 'Hosting berbasis Cloud PostgreSQL 100% aman disinkronkan real-time, zero data-loss!',
  },
]

export const GLOBAL_FAQS = [
  { q: 'Apakah TernakOS gratis?', a: 'TernakOS menyediakan paket Starter gratis selamanya. Untuk fitur yang lebih lengkap, kamu bisa mencoba trial paket Pro atau Business.' },
  { q: 'Berapa lama setup awal TernakOS?', a: 'Rata-rata kurang dari 15 menit. Daftar, pilih tipe bisnis, undang anggota tim — langsung bisa pakai.' },
  { q: 'Apakah anda kontrak jangka panjang?', a: 'Tidak. Kamu bisa cancel kapan saja. Tidak ada biaya tambahan atau penalti pembatalan.' },
]
