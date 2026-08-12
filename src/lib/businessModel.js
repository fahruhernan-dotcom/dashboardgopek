/**
 * BUSINESS CATEGORIES
 * Used for Step 1 of the onboarding overlay
 */
export const BUSINESS_CATEGORIES = [
  {
    key: 'broker',
    label: 'Broker / Pedagang',
    icon: '/assets/icons/models/broker_ayam.png',
    description: 'Jual beli ayam, telur, atau sembako antar pelaku usaha.',
  },
  {
    key: 'peternak',
    label: 'Peternak',
    icon: '/assets/icons/models/peternak_broiler.png',
    description: 'Budidaya ayam broiler atau layer, pantau produksi & biaya.',
  },
  {
    key: 'rumah_potong',
    label: 'Rumah Potong',
    icon: '🏭',
    description: 'Beli & potong ayam atau hewan ternak, kelola distribusi.',
  },
]

/**
 * ANIMAL GROUPS (Peternak only)
 * Used for the intermediate step: pick animal type before specialization.
 */
export const ANIMAL_GROUPS = [
  {
    key: 'ayam',
    label: 'Ayam',
    icon: '/assets/icons/models/peternak_broiler.png',
    description: 'Broiler (pedaging) atau Layer (petelur).',
    filter: (model) => ['peternak_broiler', 'peternak_layer'].includes(model.sub_type),
  },
  {
    key: 'bebek',
    label: 'Bebek',
    icon: '/assets/icons/models/bebek_pedaging.png',
    description: 'Bebek pedaging atau bebek petelur.',
    filter: (model) => model.sub_type?.startsWith('peternak_bebek'),
  },
  {
    key: 'domba',
    label: 'Domba',
    icon: '/assets/icons/models/fattening_domba.png',
    description: 'Fattening (feedlot) atau Breeding (pembibitan).',
    filter: (model) => model.sub_type?.startsWith('peternak_domba'),
  },
  {
    key: 'kambing',
    label: 'Kambing',
    icon: '/assets/icons/models/fattening_kambing.png',
    description: 'Fattening, Breeding, atau Kambing Perah.',
    filter: (model) => ['peternak_kambing_penggemukan', 'peternak_kambing_breeding', 'peternak_kambing_perah'].includes(model.sub_type),
  },
  {
    key: 'sapi',
    label: 'Sapi',
    icon: '/assets/icons/models/fattening_sapi.png',
    description: 'Sapi potong (fattening) atau sapi perah.',
    filter: (model) => model.sub_type?.startsWith('peternak_sapi'),
  },
  {
    key: 'babi',
    label: 'Babi',
    icon: '/assets/icons/models/babi_fattening.png',
    description: 'Babi fattening atau breeding.',
    comingSoon: true,
    filter: (model) => model.sub_type?.startsWith('peternak_babi'),
  },
]

/**
 * NAV GENERATOR
 * Dynamically builds bottomNav paths based on the model's base path and sub_type
 */
const createNav = (base, subType, items) => {
  return items.map(item => ({
    ...item,
    path: `/${base}/${subType}/${item.slug}`
  }))
}

/**
 * PRIMARY BUSINESS MODELS
 * These are the master configurations displayed in the UI cards
 */
export const BUSINESS_MODELS = {
  poultry_broker: {
    key: 'poultry_broker',
    category: 'broker',
    name: 'Broker Ayam',
    label: 'Broker / Pedagang',
    categoryLabel: 'Broker',
    icon: '/assets/icons/models/broker_ayam.png',
    description: 'Beli dari kandang, jual ke RPA. Kelola margin, piutang & pengiriman.',
    color: '#021a02',
    themeColor: 'emerald',
    user_type: 'broker',
    sub_type: 'broker_ayam',
    comingSoon: false,
    bottomNav: createNav('broker', 'broker_ayam', [
      { slug: 'beranda',   icon: 'Home',           label: 'Home'   },
      { slug: 'transaksi', icon: 'ArrowLeftRight', label: 'Transaksi' },
      { slug: 'rpa',       icon: 'Building2',      label: 'RPA'       },
      { slug: 'pengiriman',icon: 'Truck',           label: 'Kirim'     },
    ]),
    drawerMenu: [
      { path: '/broker/broker_ayam/pengiriman', icon: 'Truck',      label: 'Pengiriman & Loss' },
      { path: '/broker/broker_ayam/cashflow',   icon: 'Wallet',     label: 'Cash Flow'         },
      { path: '/harga-pasar',                   icon: 'BarChart2',  label: 'Harga Pasar'       },
      { path: '/broker/broker_ayam/armada',     icon: 'Car',        label: 'Armada & Sopir'    },
      { path: '/broker/broker_ayam/simulator',  icon: 'Calculator', label: 'Simulator Margin'  },
      { path: '/broker/broker_ayam/tim',        icon: 'User',       label: 'Tim & Akses'       },
      { path: '/market',                        icon: 'Store',      label: 'TernakOS Market'   },
      { path: '/broker/broker_ayam/akun',       icon: 'User',       label: 'Akun & Profil'     },
    ],
    fabPath: '/broker/broker_ayam/transaksi?action=new',
  },
  distributor_sembako: {
    key: 'distributor_sembako',
    category: 'broker',
    name: 'Distributor Sembako',
    label: 'Distributor Sembako',
    categoryLabel: 'Sembako',
    icon: '/assets/icons/models/distributor_sembako.png',
    description: 'Distribusi sembako ke toko-toko. Kelola stok, invoice, piutang & gaji pegawai.',
    color: '#EA580C',
    themeColor: 'orange',
    user_type: 'broker',
    sub_type: 'distributor_sembako',
    comingSoon: false,
    bottomNav: createNav('broker', 'distributor_sembako', [
      { slug: 'beranda',      icon: 'Home',           label: 'Home'   },
      { slug: 'penjualan',    icon: 'ShoppingCart',   label: 'Jual'      },
      { slug: 'gudang',       icon: 'Package',        label: 'Gudang'    },
      { slug: 'toko-supplier',icon: 'Store',          label: 'Toko'      },
    ]),
    drawerMenu: [
      { path: '/broker/distributor_sembako/produk',        icon: 'Package',  label: 'Produk & Stok' },
      { path: '/broker/distributor_sembako/toko-supplier', icon: 'Store',    label: 'Toko & Supplier'  },
      { path: '/broker/distributor_sembako/gudang',        icon: 'Warehouse',label: 'Stok & Gudang'    },
      { path: '/broker/distributor_sembako/retur',         icon: 'RotateCcw',label: 'Retur Produk'     },
      { path: '/broker/distributor_sembako/karyawan',      icon: 'Users',    label: 'Karyawan'         },
      { path: '/broker/distributor_sembako/laporan',       icon: 'BarChart2',label: 'Laporan'          },
      { path: '/broker/distributor_sembako/akun',          icon: 'User',     label: 'Akun & Profil'    },
    ],
    fabPath: '/broker/distributor_sembako/penjualan?action=new',
  },
  egg_broker: {
    key: 'egg_broker',
    category: 'broker',
    name: 'Broker Telur',
    label: 'Broker Telur',
    categoryLabel: 'Broker',
    icon: '/assets/icons/models/broker_telur.png',
    description: 'Beli telur dari peternak, jual ke agen/pasar. Kelola stok tray.',
    color: '#7C3AED',
    themeColor: 'violet',
    user_type: 'broker',
    sub_type: 'broker_telur',
    comingSoon: false,
    bottomNav: createNav('broker', 'broker_telur', [
      { slug: 'beranda',   icon: 'Home',           label: 'Home'   },
      { slug: 'pos',       icon: 'ShoppingCart',   label: 'POS'       },
      { slug: 'inventori', icon: 'Warehouse',      label: 'Gudang'    },
      { slug: 'transaksi', icon: 'ArrowLeftRight', label: 'Transaksi' },
    ]),
    drawerMenu: [
      { path: '/broker/broker_telur/beranda', icon: 'Home', label: 'Dashboard'    },
      { path: '/broker/broker_telur/akun',    icon: 'User', label: 'Akun & Profil'},
    ],
    fabPath: '/broker/broker_telur/pos',
  },
  peternak: {
    key: 'peternak',
    category: 'peternak',
    name: 'Peternak Broiler',
    label: 'Peternak Broiler',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/peternak_broiler.png',
    description: 'Pelihara ayam broiler, pantau FCR & deplesi, catat biaya produksi per kg.',
    color: '#021a02',
    themeColor: 'emerald',
    user_type: 'peternak',
    sub_type: 'peternak_broiler',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_broiler', [
      { slug: 'beranda',    icon: 'Home',           label: 'Home'   },
      { slug: 'siklus',     icon: 'RefreshCw',      label: 'Siklus'    },
      { slug: 'daily_task', icon: 'ClipboardList',   label: 'Tugas'     },
      { slug: 'akun',       icon: 'User',            label: 'Profil'    },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_broiler/vaksinasi', icon: 'Syringe', label: 'Program Vaksin'  },
      { path: '/peternak/peternak_broiler/pakan',     icon: 'Package', label: 'Stok & Pakan'    },
      { path: '/peternak/peternak_broiler/tim',       icon: 'Users',   label: 'Tim & Akses'     },
      { path: '/market',                              icon: 'Store',   label: 'TernakOS Market' },
      { path: '/peternak/peternak_broiler/akun',      icon: 'User',    label: 'Akun & Profil'   },
    ],
    fabPath: null,
  },
  peternak_layer: {
    key: 'peternak_layer',
    category: 'peternak',
    name: 'Peternak Layer',
    label: 'Peternak Layer',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/peternak_layer.png',
    description: 'Pelihara ayam petelur, pantau produksi telur harian dan inventori pakan.',
    color: '#7C3AED',
    themeColor: 'violet',
    user_type: 'peternak',
    sub_type: 'peternak_layer',
    comingSoon: true,
    bottomNav: [],
    drawerMenu: [
      { path: '/market',                         icon: 'Store', label: 'TernakOS Market' },
      { path: '/peternak/peternak_layer/akun',   icon: 'User',  label: 'Akun & Profil'  },
    ],
    fabPath: null,
  },
  rumah_potong_rpa: {
    key: 'rumah_potong_rpa',
    category: 'rumah_potong',
    name: 'RPA (Rumah Potong Ayam)',
    label: 'RPA (Rumah Potong Ayam)',
    categoryLabel: 'Industri',
    icon: '🏭',
    description: 'Beli ayam dari broker, kelola order dan pantau hutang pembelian.',
    color: '#F59E0B',
    themeColor: 'amber',
    user_type: 'rumah_potong',
    sub_type: 'rpa_ayam',
    comingSoon: false,
    bottomNav: createNav('rumah_potong', 'rpa', [
      { slug: 'beranda',    icon: 'Home',          label: 'Home'       },
      { slug: 'order',      icon: 'ClipboardList', label: 'Order'      },
      { slug: 'hutang',     icon: 'CreditCard',    label: 'Hutang'     },
      { slug: 'distribusi', icon: 'Truck',         label: 'Distribusi' },
    ]),
    drawerMenu: [
      { path: '/rumah_potong/rpa/distribusi', icon: 'Store',    label: 'Distribusi & Invoice' },
      { path: '/rumah_potong/rpa/laporan',    icon: 'BarChart2',label: 'Laporan Margin'       },
      { path: '/market',                      icon: 'Store',    label: 'TernakOS Market'      },
      { path: '/rumah_potong/rpa/akun',       icon: 'User',     label: 'Akun & Profil'        },
    ],
    fabPath: '/rumah_potong/rpa/order?action=new',
  },
  peternak_domba_penggemukan: {
    key: 'peternak_domba_penggemukan',
    category: 'peternak',
    name: 'Fattening Domba',
    label: 'Fattening Domba',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/fattening_domba.png',
    description: 'Fattening (feedlot) domba. Pantau ADG, FCR, mortalitas, dan laba per ekor per batch.',
    color: '#16A34A',
    themeColor: 'green',
    user_type: 'peternak',
    sub_type: 'peternak_domba_penggemukan',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_domba_penggemukan', [
      { slug: 'beranda',    icon: 'Home',          label: 'Home'  },
      { slug: 'daily_task', icon: 'ClipboardList', label: 'Tugas'    },
      { slug: 'pakan',      icon: 'Wheat',         label: 'Pakan'    },
      { slug: 'menu',       icon: 'Menu',          label: 'Menu'     },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_domba_penggemukan/penjualan',   icon: 'ShoppingCart', label: 'Penjualan'      },
      { path: '/peternak/peternak_domba_penggemukan/kesehatan',   icon: 'Syringe',      label: 'Kesehatan'      },
      { path: '/peternak/peternak_domba_penggemukan/stok-pakan',  icon: 'Wheat',        label: 'Stok & Pakan'   },
      { path: '/peternak/peternak_domba_penggemukan/laporan',     icon: 'BarChart2',    label: 'Laporan Batch'  },
      { path: '/peternak/peternak_domba_penggemukan/harga-pasar', icon: 'TrendingUp',   label: 'Harga Pasar'    },
      { path: '/peternak/peternak_domba_penggemukan/tim',         icon: 'Users',        label: 'Tim & Akses'    },
      { path: '/market',                                          icon: 'Store',        label: 'TernakOS Market'},
      { path: '/peternak/peternak_domba_penggemukan/akun',        icon: 'User',         label: 'Akun & Profil'  },
    ],
    fabPath: '/peternak/peternak_domba_penggemukan/quick-add',
  },
  peternak_domba_breeding: {
    key: 'peternak_domba_breeding',
    category: 'peternak',
    name: 'Breeding Domba',
    label: 'Breeding Domba',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/breeding_domba.png',
    description: 'Pembibitan (breeding) domba. Kelola pedigree, reproduksi, kelahiran, dan seleksi bibit unggul.',
    color: '#0D9488',
    themeColor: 'teal',
    user_type: 'peternak',
    sub_type: 'peternak_domba_breeding',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_domba_breeding', [
      { slug: 'beranda',    icon: 'Home',           label: 'Home'   },
      { slug: 'ternak',     icon: 'Tag',            label: 'Ternak'    },
      { slug: 'daily_task', icon: 'ClipboardList',  label: 'Tugas'     },
      { slug: 'reproduksi', icon: 'Heart',          label: 'Reproduksi'},
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_domba_breeding/kesehatan', icon: 'Syringe',  label: 'Kesehatan'      },
      { path: '/peternak/peternak_domba_breeding/pakan',   icon: 'Wheat',    label: 'Log Pakan'      },
      { path: '/peternak/peternak_domba_breeding/laporan', icon: 'BarChart2',label: 'Laporan Farm'   },
      { path: '/peternak/peternak_domba_breeding/tim',     icon: 'Users',    label: 'Tim & Akses'    },
      { path: '/market',                                   icon: 'Store',    label: 'TernakOS Market'},
      { path: '/peternak/peternak_domba_breeding/akun',   icon: 'User',     label: 'Akun & Profil'  },
    ],
    fabPath: null,
  },
  peternak_kambing_penggemukan: {
    key: 'peternak_kambing_penggemukan',
    category: 'peternak',
    name: 'Fattening Kambing',
    label: 'Fattening Kambing',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/fattening_kambing.png',
    description: 'Fattening (feedlot) kambing potong. Pantau ADG, FCR, mortalitas, dan laba per ekor.',
    color: '#16A34A',
    themeColor: 'green',
    user_type: 'peternak',
    sub_type: 'peternak_kambing_penggemukan',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_kambing_penggemukan', [
      { slug: 'beranda',    icon: 'Home',          label: 'Home'  },
      { slug: 'daily_task', icon: 'ClipboardList', label: 'Tugas'    },
      { slug: 'pakan',      icon: 'Wheat',         label: 'Pakan'    },
      { slug: 'menu',       icon: 'Menu',          label: 'Menu'     },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_kambing_penggemukan/penjualan',   icon: 'ShoppingCart', label: 'Penjualan'      },
      { path: '/peternak/peternak_kambing_penggemukan/kesehatan',   icon: 'Syringe',      label: 'Kesehatan'      },
      { path: '/peternak/peternak_kambing_penggemukan/stok-pakan',  icon: 'Wheat',        label: 'Stok & Pakan'   },
      { path: '/peternak/peternak_kambing_penggemukan/laporan',     icon: 'BarChart2',    label: 'Laporan Batch'  },
      { path: '/peternak/peternak_kambing_penggemukan/harga-pasar', icon: 'TrendingUp',   label: 'Harga Pasar'    },
      { path: '/peternak/peternak_kambing_penggemukan/tim',         icon: 'Users',        label: 'Tim & Akses'    },
      { path: '/market',                                             icon: 'Store',        label: 'TernakOS Market'},
      { path: '/peternak/peternak_kambing_penggemukan/akun',        icon: 'User',         label: 'Akun & Profil'  },
    ],
    fabPath: '/peternak/peternak_kambing_penggemukan/quick-add',
  },
  peternak_kambing_breeding: {
    key: 'peternak_kambing_breeding',
    category: 'peternak',
    name: 'Breeding Kambing',
    label: 'Breeding Kambing',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/breeding_kambing.png',
    description: 'Pembibitan kambing potong. Kelola pedigree, reproduksi, dan kelahiran.',
    color: '#0D9488',
    themeColor: 'teal',
    user_type: 'peternak',
    sub_type: 'peternak_kambing_breeding',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_kambing_breeding', [
      { slug: 'beranda',    icon: 'Home',           label: 'Home'   },
      { slug: 'ternak',     icon: 'Tag',            label: 'Ternak'    },
      { slug: 'daily_task', icon: 'ClipboardList',  label: 'Tugas'     },
      { slug: 'reproduksi', icon: 'Heart',          label: 'Reproduksi'},
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_kambing_breeding/kesehatan', icon: 'Syringe',  label: 'Kesehatan'      },
      { path: '/peternak/peternak_kambing_breeding/pakan',   icon: 'Wheat',    label: 'Log Pakan'      },
      { path: '/peternak/peternak_kambing_breeding/laporan', icon: 'BarChart2',label: 'Laporan Farm'   },
      { path: '/peternak/peternak_kambing_breeding/tim',     icon: 'Users',    label: 'Tim & Akses'    },
      { path: '/market',                                   icon: 'Store',    label: 'TernakOS Market'},
      { path: '/peternak/peternak_kambing_breeding/akun',   icon: 'User',     label: 'Akun & Profil'  },
    ],
    fabPath: null,
  },
  peternak_kambing_perah: {
    key: 'peternak_kambing_perah',
    category: 'peternak',
    name: 'Kambing Perah',
    label: 'Kambing Perah',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/kambing_perah.png',
    description: 'Produksi susu kambing. Pantau produksi harian dan kualitas susu.',
    color: '#0EA5E9',
    themeColor: 'sky',
    user_type: 'peternak',
    sub_type: 'peternak_kambing_perah',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_kambing_perah', [
      { slug: 'beranda',    icon: 'Home',           label: 'Home'  },
      { slug: 'produksi',   icon: 'Milk',           label: 'Produksi' },
      { slug: 'daily_task', icon: 'ClipboardList',   label: 'Tugas'    },
      { slug: 'ternak',     icon: 'Tag',             label: 'Ternak'   },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_kambing_perah/mating',     icon: 'Heart',    label: 'Reproduksi'      },
      { path: '/peternak/peternak_kambing_perah/kesehatan',  icon: 'Syringe',  label: 'Kesehatan'       },
      { path: '/peternak/peternak_kambing_perah/pakan',      icon: 'Wheat',    label: 'Log Pakan'       },
      { path: '/peternak/peternak_kambing_perah/penjualan',  icon: 'ShoppingCart', label: 'Jual Susu'   },
      { path: '/peternak/peternak_kambing_perah/tim',        icon: 'Users',    label: 'Tim & Akses'     },
      { path: '/market',                                     icon: 'Store',    label: 'TernakOS Market' },
      { path: '/peternak/peternak_kambing_perah/akun',       icon: 'User',     label: 'Akun & Profil'   },
    ],
    fabPath: null,
  },

  // ── Domba Penggemukan (Phase 1) ──────────────────────────
  peternak_kambing_domba_penggemukan: {
    key: 'peternak_kambing_domba_penggemukan',
    category: 'peternak',
    name: 'Fattening Kambing & Domba (Legacy)',
    label: 'Fattening Kambing & Domba',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/fattening_kambing.png',
    description: 'Versi lama. Disarankan pindah ke model Domba atau Kambing yang baru.',
    color: '#16A34A',
    themeColor: 'green',
    user_type: 'peternak',
    sub_type: 'peternak_kambing_domba_penggemukan',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_kambing_domba_penggemukan', [
      { slug: 'beranda',    icon: 'Home',           label: 'Home'  },
      { slug: 'batch',      icon: 'RefreshCw',      label: 'Batch'    },
      { slug: 'daily_task', icon: 'ClipboardList',   label: 'Tugas'    },
      { slug: 'ternak',     icon: 'Tag',             label: 'Ternak'   },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_kambing_domba_penggemukan/kesehatan', icon: 'Syringe',  label: 'Kesehatan'      },
      { path: '/peternak/peternak_kambing_domba_penggemukan/pakan',    icon: 'Wheat',    label: 'Log Pakan'      },
      { path: '/peternak/peternak_kambing_domba_penggemukan/laporan',  icon: 'BarChart2',label: 'Laporan Batch'  },
      { path: '/peternak/peternak_kambing_domba_penggemukan/tim',      icon: 'Users',    label: 'Tim & Akses'    },
      { path: '/market',                                               icon: 'Store',    label: 'TernakOS Market'},
      { path: '/peternak/peternak_kambing_domba_penggemukan/akun',     icon: 'User',     label: 'Akun & Profil'  },
    ],
    fabPath: null,
  },
  peternak_kambing_domba_breeding: {
    key: 'peternak_kambing_domba_breeding',
    category: 'peternak',
    name: 'Breeding Kambing & Domba (Legacy)',
    label: 'Breeding Kambing & Domba',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/breeding_domba.png',
    description: 'Versi lama. Disarankan pindah ke model Domba atau Kambing yang baru.',
    color: '#0D9488',
    themeColor: 'teal',
    user_type: 'peternak',
    sub_type: 'peternak_kambing_domba_breeding',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_kambing_domba_breeding', [
      { slug: 'beranda',    icon: 'Home',           label: 'Home'   },
      { slug: 'ternak',     icon: 'Tag',            label: 'Ternak'    },
      { slug: 'daily_task', icon: 'ClipboardList',  label: 'Tugas'     },
      { slug: 'reproduksi', icon: 'Heart',          label: 'Reproduksi'},
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_kambing_domba_breeding/kesehatan', icon: 'Syringe',  label: 'Kesehatan'      },
      { path: '/peternak/peternak_kambing_domba_breeding/pakan',   icon: 'Wheat',    label: 'Log Pakan'      },
      { path: '/peternak/peternak_kambing_domba_breeding/laporan', icon: 'BarChart2',label: 'Laporan Farm'   },
      { path: '/peternak/peternak_kambing_domba_breeding/tim',     icon: 'Users',    label: 'Tim & Akses'    },
      { path: '/market',                                           icon: 'Store',    label: 'TernakOS Market'},
      { path: '/peternak/peternak_kambing_domba_breeding/akun',   icon: 'User',     label: 'Akun & Profil'  },
    ],
    fabPath: null,
  },
  // ── Bebek (Coming Soon) ──
  peternak_bebek_pedaging: {
    key: 'peternak_bebek_pedaging',
    category: 'peternak',
    name: 'Bebek Pedaging',
    label: 'Bebek Pedaging',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/bebek_pedaging.png',
    description: 'Budidaya bebek pedaging. Pantau pertumbuhan, pakan, dan laba per periode.',
    color: '#0EA5E9',
    themeColor: 'sky',
    user_type: 'peternak',
    sub_type: 'peternak_bebek_pedaging',
    comingSoon: true,
    bottomNav: [],
    drawerMenu: [],
    fabPath: null,
  },
  peternak_bebek_layer: {
    key: 'peternak_bebek_layer',
    category: 'peternak',
    name: 'Bebek Petelur',
    label: 'Bebek Petelur',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/bebek_petelur.png',
    description: 'Budidaya bebek petelur. Pantau produksi telur harian dan efisiensi pakan.',
    color: '#6366F1',
    themeColor: 'indigo',
    user_type: 'peternak',
    sub_type: 'peternak_bebek_layer',
    comingSoon: true,
    bottomNav: [],
    drawerMenu: [],
    fabPath: null,
  },
  // ── Sapi ──
  peternak_sapi_penggemukan: {
    key: 'peternak_sapi_penggemukan',
    category: 'peternak',
    name: 'Fattening Sapi',
    label: 'Fattening Sapi',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/fattening_sapi.png',
    description: 'Fattening (feedlot) sapi potong. Pantau ADG, berat badan, dan laba per ekor.',
    color: '#D97706',
    themeColor: 'amber',
    user_type: 'peternak',
    sub_type: 'peternak_sapi_penggemukan',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_sapi_penggemukan', [
      { slug: 'beranda',    icon: 'Home',           label: 'Home' },
      { slug: 'daily_task', icon: 'ClipboardList',  label: 'Tugas'   },
      { slug: 'batch',      icon: 'RefreshCw',      label: 'Batch'   },
      { slug: 'menu',       icon: 'Menu',           label: 'Menu'    },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_sapi_penggemukan/task_settings', icon: 'Settings2',     label: 'Pengaturan Tugas' },
      { path: '/peternak/peternak_sapi_penggemukan/stok-pakan',    icon: 'Wheat',         label: 'Log Pakan'        },
      { path: '/peternak/peternak_sapi_penggemukan/kesehatan',     icon: 'Syringe',       label: 'Kesehatan'        },
      { path: '/peternak/peternak_sapi_penggemukan/laporan',       icon: 'BarChart2',     label: 'Laporan Batch'    },
      { path: '/peternak/peternak_sapi_penggemukan/tim',           icon: 'Users',         label: 'Tim & Akses'      },
      { path: '/market',                                           icon: 'Store',         label: 'TernakOS Market'  },
      { path: '/peternak/peternak_sapi_penggemukan/akun',          icon: 'User',          label: 'Akun & Profil'    },
    ],
    fabPath: '/peternak/peternak_sapi_penggemukan/quick-add',
  },
  peternak_sapi_breeding: {
    key: 'peternak_sapi_breeding',
    category: 'peternak',
    name: 'Breeding Sapi',
    label: 'Breeding Sapi',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/breeding_sapi.png',
    description: 'Pembibitan sapi (cow-calf). Pantau IB, kebuntingan, kelahiran pedet, dan KPI reproduksi.',
    color: '#B45309',
    themeColor: 'amber',
    user_type: 'peternak',
    sub_type: 'peternak_sapi_breeding',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_sapi_breeding', [
      { slug: 'beranda',    icon: 'Home',           label: 'Home'   },
      { slug: 'daily_task', icon: 'ClipboardList',  label: 'Tugas'     },
      { slug: 'ternak',     icon: 'Tag',            label: 'Ternak'    },
      { slug: 'menu',       icon: 'Menu',           label: 'Menu'      },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_sapi_breeding/task_settings', icon: 'Settings2', label: 'Pengaturan Tugas' },
      { path: '/peternak/peternak_sapi_breeding/stok-pakan',    icon: 'Wheat',     label: 'Log Pakan'        },
      { path: '/peternak/peternak_sapi_breeding/laporan',       icon: 'BarChart2', label: 'Laporan Farm'     },
      { path: '/peternak/peternak_sapi_breeding/tim',           icon: 'Users',     label: 'Tim & Akses'      },
      { path: '/market',                                        icon: 'Store',     label: 'TernakOS Market'  },
      { path: '/peternak/peternak_sapi_breeding/akun',          icon: 'User',      label: 'Akun & Profil'    },
    ],
    fabPath: null,
  },
  peternak_sapi_perah: {
    key: 'peternak_sapi_perah',
    category: 'peternak',
    name: 'Sapi Perah',
    label: 'Sapi Perah',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/sapi_perah.png',
    description: 'Produksi susu sapi. Pantau produksi harian, kualitas susu, dan kesehatan laktasi.',
    color: '#0EA5E9',
    themeColor: 'sky',
    user_type: 'peternak',
    sub_type: 'peternak_sapi_perah',
    comingSoon: true,
    bottomNav: [],
    drawerMenu: [],
    fabPath: null,
  },
  // ── Babi (Coming Soon) ──
  peternak_babi_penggemukan: {
    key: 'peternak_babi_penggemukan',
    category: 'peternak',
    name: 'Fattening Babi',
    label: 'Fattening Babi',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/babi_fattening.png',
    description: 'Penggemukan babi. Pantau pertumbuhan, FCR, dan laba per ekor per batch.',
    color: '#EC4899',
    themeColor: 'pink',
    user_type: 'peternak',
    sub_type: 'peternak_babi_penggemukan',
    comingSoon: true,
    bottomNav: [],
    drawerMenu: [],
    fabPath: null,
  },
  peternak_babi_breeding: {
    key: 'peternak_babi_breeding',
    category: 'peternak',
    name: 'Breeding Babi',
    label: 'Breeding Babi',
    categoryLabel: 'Peternak',
    icon: '/assets/icons/models/babi_breeding.png',
    description: 'Pembibitan babi. Kelola reproduksi, kelahiran, dan seleksi bibit.',
    color: '#DB2777',
    themeColor: 'pink',
    user_type: 'peternak',
    sub_type: 'peternak_babi_breeding',
    comingSoon: true,
    bottomNav: [],
    drawerMenu: [],
    fabPath: null,
  },
  rumah_potong_rph: {
    key: 'rumah_potong_rph',
    category: 'rumah_potong',
    name: 'RPH (Rumah Potong Hewan)',
    label: 'RPH (Rumah Potong Hewan)',
    categoryLabel: 'Industri',
    icon: '🐄',
    description: 'Pemotongan sapi/kambing. Kelola stok dan distribusi daging.',
    color: '#F59E0B',
    themeColor: 'amber',
    user_type: 'rumah_potong',
    sub_type: 'rph',
    comingSoon: true,
    bottomNav: [],
    drawerMenu: [
      { path: '/market',                icon: 'Store', label: 'TernakOS Market' },
      { path: '/rumah_potong/rph/akun', icon: 'User',  label: 'Akun & Profil'  },
    ],
    fabPath: null,
  }
}

/**
 * LEGACY ALIASES
 * Used for resolving old vertical names or sub_types to primary model keys.
 * Kept separate to prevent duplication in UI card listings.
 */
export const VERTICAL_ALIASES = {
  // Vertical aliases
  'sembako_broker':    'distributor_sembako',
  'broker':            'poultry_broker',
  
  // Sub-type aliases
  'broker_ayam':        'poultry_broker',
  'broker_telur':       'egg_broker',
  'distributor_sembako':'distributor_sembako',
  'distributor_daging': 'poultry_broker',
  'peternak_broiler':        'peternak',
  'peternak_layer':          'peternak_layer',
  'peternak_kambing_domba_penggemukan': 'peternak_domba_penggemukan', 
  'peternak_kambing_domba_breeding':    'peternak_domba_breeding',    
  'peternak_domba_penggemukan':         'peternak_domba_penggemukan',
  'peternak_domba_breeding':            'peternak_domba_breeding',
  'peternak_kambing_penggemukan':       'peternak_kambing_penggemukan',
  'peternak_kambing_breeding':          'peternak_kambing_breeding',
  'peternak_kambing_perah':             'peternak_kambing_perah',
  'rpa_ayam':           'rumah_potong_rpa',
  'rph':                'rumah_potong_rph',
}

/**
 * PATH GENERATORS
 */
export const getXBasePath = (tenant, profile) => {
  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical]
  
  if (!model) return '/broker/broker_ayam'

  const base = model.category === 'peternak' ? 'peternak' 
             : model.category === 'rumah_potong' ? 'rumah_potong' 
             : 'broker'
             
  return `/${base}/${model.sub_type}`
}

/**
 * COMPAT: Maps old (userType, subType) API to the new flat BUSINESS_MODELS
 */
export function getBusinessModel(userType, subType) {
  const profile = { user_type: userType, sub_type: subType }
  const vertical = resolveBusinessVertical(profile, null)
  return BUSINESS_MODELS[vertical] || BUSINESS_MODELS.poultry_broker
}

/**
 * COMPAT: Legacy sub_type → vertical key mapping (was SUB_TYPE_TO_VERTICAL)
 */
export const SUB_TYPE_TO_VERTICAL = VERTICAL_ALIASES

/**
 * CENTRALIZED RESOLUTION LOGIC
 */
export function resolveBusinessVertical(profile, tenant) {
  let resolved = null
  const userType = profile?.user_type

  // 1. Forced Sembako logic (Highest priority)
  // Only apply if user is NOT explicitly a peternak (to avoid hijacking peternak profiles)
  const isSembakoName = userType !== 'peternak' && (tenant?.business_name || profile?.business_name || '').toLowerCase().includes('sembako')
  if (isSembakoName) {
    resolved = 'distributor_sembako'
  }

  // 2. Direct vertical field check
  if (!resolved) {
    const directVertical = tenant?.business_vertical || profile?.business_vertical
    if (directVertical) {
      if (BUSINESS_MODELS[directVertical]) resolved = directVertical
      else if (VERTICAL_ALIASES[directVertical]) resolved = VERTICAL_ALIASES[directVertical]
    }
  }

  // 3. Sub-type mapping check
  if (!resolved) {
    const subType = tenant?.sub_type || profile?.sub_type
    if (subType && VERTICAL_ALIASES[subType]) {
      resolved = VERTICAL_ALIASES[subType]
    }
  }

  // 4. Default Fallback khusus aplikasi Sembako Client
  if (!resolved) {
    resolved = 'distributor_sembako'
  }

  return resolved
}
