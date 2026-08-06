import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Users, Activity, Trash2, RefreshCw, 
  Search, CheckCircle2, Cpu, Database, 
  Zap, Server, Clock, Sparkles, CheckCircle, ShieldCheck, ArrowRight,
  ShieldAlert, AlertTriangle
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/lib/hooks/useAuth'
import SembakoRecycleBin from '@/dashboard/broker/sembako_broker/components/SembakoRecycleBin'
import KelolaAkunPage from '@/dashboard/broker/sembako_broker/KelolaAkunPage'
import { cn } from '@/lib/utils'

export default function SuperadminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  // Reset database states
  const [wipeTransactions] = useState(true)
  const [wipeCatalog, setWipeCatalog] = useState(false)
  const [showConfirm1, setShowConfirm1] = useState(false)
  const [showConfirm2, setShowConfirm2] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const [dbLatency, setDbLatency] = useState(null)
  const [isCheckingPing, setIsCheckingPing] = useState(false)

  // System License Expiry State (Admin Controls)
  const [serverDays, setServerDays] = useState(() => {
    return Number(localStorage.getItem('ternakos_server_days')) || 999
  })

  // System Logs State
  const [logFilter] = useState('ALL')
  const [logSearch, setLogSearch] = useState('')
  const [systemLogs, setSystemLogs] = useState(() => {
    const saved = localStorage.getItem('ternakos_dev_logs')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        level: 'INFO',
        source: 'Supabase REST',
        message: 'Database Connection Pool Ready (Sembako OS Active)',
        details: { tenant_id: tenant?.id || 'default' }
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        level: 'WARN',
        source: 'PostgREST Schema',
        message: 'Column whitelist active for sembako_customers payload sanitization',
        details: { table: 'sembako_customers' }
      }
    ]
  })

  // Dynamic Health Check Ping (Triggered on Demand)
  const checkHealth = async () => {
    setIsCheckingPing(true)
    const start = performance.now()
    try {
      await supabase.from('sembako_products').select('id').limit(1)
      const end = performance.now()
      setDbLatency(Math.round(end - start))
    } catch {
      setDbLatency(999)
    } finally {
      setIsCheckingPing(false)
    }
  }

  const handleUpdateServerDays = (days) => {
    setServerDays(days)
    localStorage.setItem('ternakos_server_days', days.toString())
    toast.success(`Masa aktif server berhasil diatur ke ${days} Hari`)
  }

  const handleClearLogs = () => {
    setSystemLogs([])
    localStorage.removeItem('ternakos_dev_logs')
    toast.success('Logs konsol berhasil dibersihkan')
  }

  const handleFlushCache = () => {
    queryClient.invalidateQueries()
    toast.success('React Query Cache berhasil dibersihkan')
  }

  const handleResetDatabase = async () => {
    if (confirmText !== 'RESET GOPEK') {
      toast.error('Konfirmasi kata kunci salah')
      return
    }
    setIsResetting(true)
    const toastId = toast.loading('Sedang mereset database bisnis...')
    try {
      const tenantId = tenant.id

      // 1. Delete transactional data in correct order of dependency
      const { error: errDeliv } = await supabase.from('sembako_deliveries').delete().eq('tenant_id', tenantId)
      if (errDeliv) throw errDeliv

      const { error: errPay } = await supabase.from('sembako_payroll').delete().eq('tenant_id', tenantId)
      if (errPay) throw errPay

      const { error: errPaym } = await supabase.from('sembako_payments').delete().eq('tenant_id', tenantId)
      if (errPaym) throw errPaym

      const { error: errSaleItems } = await supabase.from('sembako_sale_items').delete().eq('tenant_id', tenantId)
      if (errSaleItems) throw errSaleItems

      const { error: errSales } = await supabase.from('sembako_sales').delete().eq('tenant_id', tenantId)
      if (errSales) throw errSales

      const { error: errStockOut } = await supabase.from('sembako_stock_out').delete().eq('tenant_id', tenantId)
      if (errStockOut) throw errStockOut

      const { error: errReturns } = await supabase.from('sembako_returns').delete().eq('tenant_id', tenantId)
      if (errReturns) throw errReturns

      const { error: errSupPay } = await supabase.from('sembako_supplier_payments').delete().eq('tenant_id', tenantId)
      if (errSupPay) throw errSupPay

      const { error: errBatches } = await supabase.from('sembako_stock_batches').delete().eq('tenant_id', tenantId)
      if (errBatches) throw errBatches

      const { error: errAudit } = await supabase.from('sembako_audit_logs').delete().eq('tenant_id', tenantId)
      if (errAudit) throw errAudit

      // 2. Conditional wipe of catalog/master files
      if (wipeCatalog) {
        const { error: errProd } = await supabase.from('sembako_products').delete().eq('tenant_id', tenantId)
        if (errProd) throw errProd

        const { error: errCust } = await supabase.from('sembako_customers').delete().eq('tenant_id', tenantId)
        if (errCust) throw errCust

        const { error: errSupp } = await supabase.from('sembako_suppliers').delete().eq('tenant_id', tenantId)
        if (errSupp) throw errSupp

        const { error: errEmp } = await supabase.from('sembako_employees').delete().eq('tenant_id', tenantId)
        if (errEmp) throw errEmp
      } else {
        // Reset current_stock and avg_buy_price in sembako_products to 0
        const { error: errProdReset } = await supabase.from('sembako_products')
          .update({ current_stock: 0, avg_buy_price: 0 })
          .eq('tenant_id', tenantId)
        if (errProdReset) throw errProdReset
      }

      toast.success('Database bisnis berhasil di-reset!', { id: toastId })
      queryClient.invalidateQueries()
      
      setShowConfirm2(false)
      setConfirmText('')
    } catch (e) {
      toast.error('Gagal melakukan reset database: ' + e.message, { id: toastId })
    } finally {
      setIsResetting(false)
    }
  }

  const filteredLogs = useMemo(() => {
    return systemLogs.filter(log => {
      const matchFilter = logFilter === 'ALL' || log.level === logFilter
      const matchSearch = !logSearch || 
        log.message?.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.source?.toLowerCase().includes(logSearch.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [systemLogs, logFilter, logSearch])

  return (
    <div className="space-y-6">
      
      {/* Header Banner - Vercel Command Banner */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
              System Overview
            </span>
            <span className="text-slate-400 text-xs font-semibold">TernakOS / Sembako SaaS</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ringkasan Pengelola System Web
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
            Kelola lisensi server bisnis ini, pengguna tim, kesehatan database, serta log audit kesalahan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <div className="bg-[#172033] border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Server size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Ping</p>
              <p className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5 pt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {dbLatency !== null ? `${dbLatency}ms Normal` : 'Online'}
              </p>
            </div>
          </div>

          <Button 
            onClick={checkHealth} 
            disabled={isCheckingPing}
            variant="outline" 
            className="h-12 rounded-2xl bg-[#172033] hover:bg-slate-800 border-slate-700/60 text-slate-200 text-xs font-bold gap-2 px-4 transition-all"
          >
            <RefreshCw size={14} className={cn(isCheckingPing && "animate-spin text-orange-400")} />
            Health Check
          </Button>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="bg-[#111726] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Masa Server</span>
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <p className="font-display text-3xl font-black text-white tracking-tight">{serverDays} HARI</p>
            <p className="text-[11px] font-bold text-emerald-400 pt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Lisensi Server Aktif
            </p>
          </div>
        </Card>

        <Card className="bg-[#111726] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database Engine</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database size={16} />
            </div>
          </div>
          <div>
            <p className="font-display text-3xl font-black text-emerald-400 tracking-tight">ONLINE</p>
            <p className="text-[11px] font-medium text-slate-400 pt-1">PostgreSQL 15 Supabase</p>
          </div>
        </Card>

        <Card className="bg-[#111726] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pengguna Terdaftar</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Users size={16} />
            </div>
          </div>
          <div>
            <p className="font-display text-3xl font-black text-white tracking-tight">3 AKUN</p>
            <p className="text-[11px] font-medium text-blue-400 pt-1">Owner, Admin, Dev</p>
          </div>
        </Card>

        <Card className="bg-[#111726] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telemetry Logs</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Activity size={16} />
            </div>
          </div>
          <div>
            <p className="font-display text-3xl font-black text-white tracking-tight">{systemLogs.length} LOGS</p>
            <p className="text-[11px] font-medium text-purple-400 pt-1">Audit Record Status</p>
          </div>
        </Card>

      </div>

      {/* Main Content Tabs */}
      <Card className="bg-[#111726] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <Tabs 
          value={activeTab} 
          onValueChange={(val) => setSearchParams(val === 'overview' ? {} : { tab: val })} 
          className="w-full"
        >
          <TabsList className="bg-[#0B0F17] border border-slate-800 p-1.5 h-13 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
            <TabsTrigger value="overview" className="rounded-xl text-xs font-bold uppercase tracking-wider gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white h-10 transition-all">
              <Clock size={15} /> Lisensi Server
            </TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-xl text-xs font-bold uppercase tracking-wider gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white h-10 transition-all">
              <Users size={15} /> Kelola Akun
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-xl text-xs font-bold uppercase tracking-wider gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white h-10 transition-all">
              <Activity size={15} /> Error Logs
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="rounded-xl text-xs font-bold uppercase tracking-wider gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white h-10 transition-all">
              <Cpu size={15} /> Diagnostics
            </TabsTrigger>
            <TabsTrigger value="recycle" className="rounded-xl text-xs font-bold uppercase tracking-wider gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white h-10 transition-all">
              <Trash2 size={15} /> Recycle Bin
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SERVER LICENSING MANAGER */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-white text-lg tracking-tight flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-400" />
                  Pengaturan Lisensi Server Aplikasi
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Pilih durasi aktif server bisnis ini secara langsung. Pengaturan ini akan langsung memengaruhi masa aktif aplikasi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                
                {/* 999 HARI CARD */}
                <div 
                  onClick={() => handleUpdateServerDays(999)}
                  className={cn(
                    "p-6 rounded-2xl border cursor-pointer transition-all space-y-4 relative overflow-hidden group",
                    serverDays === 999
                      ? "bg-gradient-to-br from-emerald-950/50 via-[#172033] to-[#111726] border-emerald-500/60 shadow-xl ring-1 ring-emerald-500/30"
                      : "bg-[#0B0F17] border-slate-800 hover:border-slate-700"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      Rekomendasi Dev
                    </span>
                    {serverDays === 999 && <CheckCircle size={20} className="text-emerald-400" />}
                  </div>

                  <div>
                    <h4 className="font-display font-black text-2xl text-white">999 HARI</h4>
                    <p className="text-xs font-semibold text-emerald-300 mt-1">Unlimited / Permanen</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Masa aktif server tanpa batas waktu untuk pengembangan penuh dan lisensi seumur hidup.
                  </p>
                </div>

                {/* 365 HARI CARD */}
                <div 
                  onClick={() => handleUpdateServerDays(365)}
                  className={cn(
                    "p-6 rounded-2xl border cursor-pointer transition-all space-y-4 relative overflow-hidden group",
                    serverDays === 365
                      ? "bg-gradient-to-br from-orange-950/50 via-[#172033] to-[#111726] border-orange-500/60 shadow-xl ring-1 ring-orange-500/30"
                      : "bg-[#0B0F17] border-slate-800 hover:border-slate-700"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                      Tahunan
                    </span>
                    {serverDays === 365 && <CheckCircle size={20} className="text-orange-400" />}
                  </div>

                  <div>
                    <h4 className="font-display font-black text-2xl text-white">365 HARI</h4>
                    <p className="text-xs font-semibold text-orange-300 mt-1">Lisensi 1 Tahun</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Masa berlangganan standar 1 tahun untuk operasional toko client.
                  </p>
                </div>

                {/* 30 HARI CARD */}
                <div 
                  onClick={() => handleUpdateServerDays(30)}
                  className={cn(
                    "p-6 rounded-2xl border cursor-pointer transition-all space-y-4 relative overflow-hidden group",
                    serverDays === 30
                      ? "bg-gradient-to-br from-blue-950/50 via-[#172033] to-[#111726] border-blue-500/60 shadow-xl ring-1 ring-blue-500/30"
                      : "bg-[#0B0F17] border-slate-800 hover:border-slate-700"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                      Uji Coba
                    </span>
                    {serverDays === 30 && <CheckCircle size={20} className="text-blue-400" />}
                  </div>

                  <div>
                    <h4 className="font-display font-black text-2xl text-white">30 HARI</h4>
                    <p className="text-xs font-semibold text-blue-300 mt-1">Lisensi 1 Bulan Trial</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Masa uji coba terbatas 30 hari sebelum aktivasi penuh.
                  </p>
                </div>

              </div>
            </div>
          </TabsContent>

          {/* TAB 2: KELOLA AKUN */}
          <TabsContent value="accounts" className="mt-0">
            {activeTab === 'accounts' && <KelolaAkunPage />}
          </TabsContent>

          {/* TAB 3: ERROR LOGS */}
          <TabsContent value="logs" className="mt-0 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    placeholder="Cari log kesalahan..."
                    className="bg-[#0B0F17] border-slate-800 pl-10 h-11 text-xs font-bold text-white rounded-xl"
                  />
                </div>
              </div>

              <Button 
                onClick={handleClearLogs}
                variant="outline" 
                size="sm"
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20 rounded-xl font-bold text-xs gap-2 h-11 px-4"
              >
                <Trash2 size={14} /> Clear Logs
              </Button>
            </div>

            <div className="bg-[#0B0F17] border border-slate-800 rounded-2xl p-4 font-mono text-xs overflow-x-auto min-h-[380px] max-h-[500px] space-y-3 shadow-inner">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-500/40" />
                  <p className="font-bold text-slate-400">Tidak ada log kesalahan yang tercatat</p>
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-[#172033] border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[9px] font-black">
                          {log.level}
                        </span>
                        <span className="text-slate-400 font-bold">[{log.source}]</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <p className="text-slate-200 font-semibold">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 4: DIAGNOSTICS */}
          <TabsContent value="diagnostics" className="mt-0 space-y-4">
            <div className="bg-[#0B0F17] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-extrabold text-white text-lg uppercase flex items-center gap-2">
                <Zap size={20} className="text-amber-400" />
                Cache & Diagnostics Manager
              </h3>
              <Button onClick={handleFlushCache} className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold h-11 px-5 shadow-lg">
                Flush React Query Cache
              </Button>
            </div>

            {/* Danger Zone: Reset Data Bisnis */}
            <Card className="bg-red-950/10 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-display font-black text-red-400 text-base uppercase leading-none">Zona Bahaya: Reset Database Bisnis</h3>
                  <p className="text-[10px] text-red-500/80 font-bold uppercase tracking-wider mt-1.5">Hanya untuk Owner / Dev Superadmin</p>
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-xl border border-red-500/10 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-300">
                    Pilih cakupan data bisnis yang ingin dihapus/dibersihkan dari database:
                  </p>
                  
                  <div className="space-y-2.5 pt-2 text-xs">
                    <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                      <input 
                        type="checkbox" 
                        checked={wipeTransactions} 
                        disabled 
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500 cursor-not-allowed" 
                      />
                      <div>
                        <strong>Reset Transaksi & Operasional (Wajib)</strong>
                        <p className="text-[10px] text-slate-400 mt-0.5">Menghapus Nota Penjualan, Pembayaran, Trip Kirim Barang, Kas Masuk/Keluar, Retur Toko, Payroll, dan Logs.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                      <input 
                        type="checkbox" 
                        checked={wipeCatalog} 
                        onChange={e => setWipeCatalog(e.target.checked)} 
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500" 
                      />
                      <div>
                        <strong>Reset Katalog & Kontak (Opsional)</strong>
                        <p className="text-[10px] text-slate-400 mt-0.5">Menghapus Produk Katalog, Daftar Toko (Pelanggan), Supplier (Pabrik), dan Pegawai.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[10px] font-black text-red-400 leading-relaxed uppercase tracking-wider">
                    PENTING: Akun Login Owner/Superadmin, Hak Akses Akun, Tenant Bisnis, dan Info Langganan TIDAK akan dihapus. Anda tidak akan terkunci keluar dari sistem.
                  </p>
                </div>

                <Button 
                  onClick={() => setShowConfirm1(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-red-950/20 transition-all active:scale-[0.98]"
                >
                  Mulai Reset Data Bisnis
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 5: RECYCLE BIN */}
          <TabsContent value="recycle" className="mt-0">
            {activeTab === 'recycle' && <SembakoRecycleBin tenantId={tenant?.id || '00000000-0000-0000-0000-000000000002'} />}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Modals Konfirmasi Reset Database */}
      {/* Konfirmasi 1 */}
      <AlertDialog open={showConfirm1} onOpenChange={setShowConfirm1}>
        <AlertDialogContent className="bg-[#0C1319] border-white/10 rounded-[32px] p-8 max-w-md text-left">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-display font-black tracking-tight uppercase text-xl flex items-center gap-2">
              <ShieldAlert size={24} className="text-red-500" />
              Reset Database (Konfirmasi 1 dari 2)
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-3 leading-relaxed">
              Apakah Anda benar-benar yakin ingin melakukan reset data bisnis Anda? Tindakan ini akan menghapus semua data operasional yang dipilih. Ini bersifat permanen dan tidak dapat dibatalkan di masa depan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-8">
            <AlertDialogCancel className="bg-white/5 border-none hover:bg-white/10 text-slate-400 rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] cursor-pointer">
              Batal
            </AlertDialogCancel>
            <Button 
              onClick={() => {
                setShowConfirm1(false)
                setTimeout(() => setShowConfirm2(true), 300)
              }}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] border-none cursor-pointer flex-1"
            >
              Lanjutkan ke Konfirmasi Akhir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi 2 */}
      <AlertDialog open={showConfirm2} onOpenChange={(v) => { if (!v && !isResetting) { setShowConfirm2(false); setConfirmText(''); } }}>
        <AlertDialogContent className="bg-[#0C1319] border-white/10 rounded-[32px] p-8 max-w-md text-left">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 font-display font-black tracking-tight uppercase text-xl flex items-center gap-2">
              <AlertTriangle size={24} className="text-red-500 animate-bounce" />
              PERINGATAN KERAS! (Konfirmasi 2 dari 2)
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 font-bold mt-3 leading-relaxed">
              Ini adalah langkah terakhir. Seluruh transaksi operasional, sisa hutang/piutang, serta riwayat stok akan bersih total. 
              <br /><br />
              Ketik kata kunci <strong className="text-red-400 font-black">"RESET GOPEK"</strong> di bawah untuk mengonfirmasi:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4">
            <Input 
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Ketik RESET GOPEK di sini..."
              disabled={isResetting}
              className="bg-[#111C24] border-white/10 h-14 text-sm font-black text-white rounded-2xl focus:border-red-500 focus:ring-red-500/20"
            />
          </div>

          <AlertDialogFooter className="gap-3 mt-8">
            <AlertDialogCancel 
              disabled={isResetting}
              className="bg-white/5 border-none hover:bg-white/10 text-slate-400 rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] cursor-pointer"
            >
              Batal
            </AlertDialogCancel>
            <Button 
              disabled={isResetting || confirmText !== 'RESET GOPEK'}
              onClick={handleResetDatabase}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] border-none cursor-pointer flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isResetting ? 'Mereset Database...' : 'Ya, Reset Seluruh Database Sekarang!'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
