import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, ShieldCheck, Users, Activity, Trash2, RefreshCw, 
  Search, AlertTriangle, CheckCircle2, Cpu, Database, 
  KeyRound, ShieldAlert, HardDrive, Wifi, Server,
  Copy, Check, FileText, ArrowRight, CornerDownRight
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/hooks/useAuth'
import SembakoRecycleBin from '@/dashboard/broker/sembako_broker/components/SembakoRecycleBin'
import KelolaAkunPage from '@/dashboard/broker/sembako_broker/KelolaAkunPage'
import { cn } from '@/lib/utils'
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
import { useLicense } from '@/hooks/useLicense'
import { LicenseStatusCard } from '@/components/license/LicenseStatusCard'
import { LicenseTimeline } from '@/components/license/LicenseTimeline'
import { LicenseActions } from '@/components/license/LicenseActions'
import { LicenseHistory } from '@/components/license/LicenseHistory'

export default function DevAdminHubPage() {
  const { user, profile, tenant } = useAuth()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('logs')
  const [dbLatency, setDbLatency] = useState(null)
  const [isCheckingPing, setIsCheckingPing] = useState(false)
  const [copiedLogId, setCopiedLogId] = useState(null)

  // Reset database states
  const [wipeTransactions] = useState(true)
  const [wipeCatalog, setWipeCatalog] = useState(false)
  const [showConfirm1, setShowConfirm1] = useState(false)
  const [showConfirm2, setShowConfirm2] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  // License hook
  const license = useLicense()

  // (license actions are handled via useLicense hook)

  // System Logs State (mocked + localStorage captured errors)
  const [logFilter, setLogFilter] = useState('ALL')
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
        message: 'Database Connection Pool Ready (Active Tenant Sync)',
        details: { tenant_id: tenant?.id || 'default' }
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        level: 'WARN',
        source: 'PostgREST Schema',
        message: 'Column fallback engaged for sembako_customers payload sanitization',
        details: { table: 'sembako_customers', stripped_fields: ['area', 'credit_limit'] }
      }
    ]
  })

  // Measure Supabase Connection Latency
  const checkHealth = async () => {
    setIsCheckingPing(true)
    const start = performance.now()
    try {
      await supabase.from('sembako_products').select('id').limit(1)
      const end = performance.now()
      setDbLatency(Math.round(end - start))
      toast.success('Database health check normal')
    } catch {
      setDbLatency(999)
      toast.error('Ping ke database mengalami kendala')
    } finally {
      setIsCheckingPing(false)
    }
  }

  useEffect(() => {
    checkHealth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id])

  const handleClearLogs = () => {
    setSystemLogs([])
    localStorage.removeItem('ternakos_dev_logs')
    toast.success('Logs konsol berhasil dibersihkan')
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

      const { error: errExpenses } = await supabase.from('sembako_expenses').delete().eq('tenant_id', tenantId)
      if (errExpenses) throw errExpenses

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

  const handleFlushCache = () => {
    queryClient.invalidateQueries()
    toast.success('React Query Cache & Invalidation berhasil dibersihkan')
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
    <div className="bg-[#06090F] min-h-screen text-slate-100 p-4 sm:p-8 space-y-6 selection:bg-[#EA580C]/30 selection:text-orange-200">
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Admin Console */}
      <header className="relative z-10 bg-[#0F172A] border border-white/10 rounded-[28px] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EA580C] to-amber-600 border border-orange-400/30 flex items-center justify-center text-white shadow-lg shadow-orange-950/40 shrink-0">
            <Terminal size={28} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#EA580C]/20 text-[#EA580C] border border-[#EA580C]/40 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 animate-pulse">
                DEV MODE ACTIVE
              </Badge>
              <Badge className="bg-white/5 text-slate-300 border border-white/10 text-[10px] font-bold px-2 py-0.5">
                Role: {profile?.role || 'Developer'}
              </Badge>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Web Admin & System Management
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Konsol inspeksi kesehatan sistem, error log, manajemen akses akun, dan diagnosa cache.
            </p>
          </div>
        </div>

        {/* Server & DB Status Badges */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-white/[0.03] border border-white/10 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Server size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supabase DB</p>
              <p className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                CONNECTED {dbLatency !== null && `(${dbLatency}ms)`}
              </p>
            </div>
          </div>

          <Button 
            onClick={checkHealth} 
            disabled={isCheckingPing}
            variant="outline" 
            className="h-12 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-slate-200 text-xs font-bold gap-2 px-4"
          >
            <RefreshCw size={14} className={cn(isCheckingPing && "animate-spin text-[#EA580C]")} />
            Ping System
          </Button>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <main className="relative z-10 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#0F172A] border border-white/10 p-1.5 h-14 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <TabsTrigger 
              value="logs" 
              className="rounded-xl text-xs font-black uppercase tracking-wider gap-2 data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all h-11"
            >
              <Activity size={16} /> Error & System Logs
            </TabsTrigger>
            <TabsTrigger 
              value="accounts" 
              className="rounded-xl text-xs font-black uppercase tracking-wider gap-2 data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all h-11"
            >
              <Users size={16} /> Kelola Akun Login
            </TabsTrigger>
            <TabsTrigger 
              value="diagnostics" 
              className="rounded-xl text-xs font-black uppercase tracking-wider gap-2 data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all h-11"
            >
              <Cpu size={16} /> Diagnostics & Cache
            </TabsTrigger>
            <TabsTrigger 
              value="recycle" 
              className="rounded-xl text-xs font-black uppercase tracking-wider gap-2 data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all h-11"
            >
              <Trash2 size={16} /> Recycle Bin Data
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ERROR & SYSTEM LOGS CONSOLE */}
          <TabsContent value="logs" className="mt-0 space-y-4">
            <Card className="bg-[#0F172A] border border-white/10 rounded-[28px] p-6 shadow-xl space-y-6">
              
              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                      placeholder="Cari log kesalahan..."
                      className="bg-[#111C24] border-white/10 pl-10 h-11 text-xs font-bold text-white rounded-xl focus:border-[#EA580C]"
                    />
                  </div>

                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    {['ALL', 'ERROR', 'WARN', 'INFO'].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setLogFilter(lvl)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                          logFilter === lvl 
                            ? "bg-[#EA580C] text-white shadow-md" 
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleClearLogs}
                  variant="outline" 
                  size="sm"
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20 rounded-xl font-bold text-xs gap-2 h-11 px-4 w-full sm:w-auto"
                >
                  <Trash2 size={14} /> Clear Logs
                </Button>
              </div>

              {/* Logs Console Box */}
              <div className="bg-[#06090F] border border-white/10 rounded-2xl p-4 font-mono text-xs overflow-x-auto min-h-[380px] max-h-[500px] space-y-3 shadow-inner">
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-2">
                    <CheckCircle2 size={36} className="text-emerald-500/40" />
                    <p className="font-bold text-slate-400">Tidak ada log kesalahan yang tercatat</p>
                    <p className="text-[11px] text-slate-600">Sistem berjalan bersih tanpa exception PostgREST atau Runtime Error.</p>
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div 
                      key={log.id} 
                      className="p-3.5 rounded-xl bg-[#0F172A]/80 border border-white/5 hover:border-white/10 transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase",
                            log.level === 'ERROR' && "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                            log.level === 'WARN' && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                            log.level === 'INFO' && "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          )}>
                            {log.level}
                          </span>
                          <span className="text-slate-400 font-bold">[{log.source}]</span>
                          <span className="text-slate-500 text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                          </span>
                        </div>

                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(log, null, 2))
                            setCopiedLogId(log.id)
                            setTimeout(() => setCopiedLogId(null), 2000)
                          }}
                          className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          {copiedLogId === log.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>

                      <p className="text-slate-200 font-semibold leading-relaxed">
                        {log.message}
                      </p>

                      {log.details && (
                        <div className="bg-[#06090F] p-2.5 rounded-lg border border-white/5 text-[10px] text-slate-400 overflow-x-auto">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: KELOLA AKUN LOGIN */}
          <TabsContent value="accounts" className="mt-0">
            <KelolaAkunPage />
          </TabsContent>

          {/* TAB 3: DIAGNOSTICS & CACHE */}
          <TabsContent value="diagnostics" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cache Management Card */}
              <Card className="bg-[#0F172A]/90 backdrop-blur-md border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-white text-lg tracking-tight uppercase">Cache & State Manager</h3>
                    <p className="text-xs text-slate-400">Purge data sementara dan atur ulang cache React Query</p>
                  </div>
                </div>

                <Separator className="bg-white/10 my-2" />

                <div className="space-y-3">
                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-white">React Query Invalidation</p>
                      <p className="text-[11px] text-slate-400">Refresh semua query toko, stok, dan penjualan</p>
                    </div>
                    <Button 
                      onClick={handleFlushCache}
                      className="bg-[#EA580C] hover:bg-[#D44E0A] rounded-xl text-xs font-bold h-10 px-4"
                    >
                      Flush Cache
                    </Button>
                  </div>

                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-white">Tenant Storage State</p>
                      <p className="text-[11px] text-slate-400">Active Tenant: {tenant?.id || 'Default'}</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      ACTIVE
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Database Connection Info */}
              <Card className="bg-[#0F172A]/90 backdrop-blur-md border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Database size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-white text-lg tracking-tight uppercase">Supabase REST Diagnostics</h3>
                    <p className="text-xs text-slate-400">Informasi endpoint PostgREST API</p>
                  </div>
                </div>

                <Separator className="bg-white/10 my-2" />

                <div className="space-y-3 text-xs">
                  <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Endpoint</p>
                    <p className="font-mono text-slate-200 truncate">https://kqbxzokrpcwuxrfjshuf.supabase.co</p>
                  </div>

                  <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Auth User ID</p>
                    <p className="font-mono text-slate-200 truncate">{user?.id || 'Dev Session'}</p>
                  </div>
                </div>
              </Card>

            </div>

            {/* License Management Section */}
            <Card className="bg-[#0F172A]/90 backdrop-blur-md border border-white/10 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 mt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Server size={22} />
                </div>
                <div>
                  <h3 className="font-display font-black text-white text-lg tracking-tight uppercase">License Management</h3>
                  <p className="text-xs text-slate-400">Atur dan perbarui masa aktif server klien distributor secara langsung. Semua tindakan perubahan memerlukan konfirmasi.</p>
                </div>
              </div>

              <Separator className="bg-white/10 my-1" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Col 1: Status + Timeline */}
                <div className="lg:col-span-4 space-y-5">
                  <LicenseStatusCard
                    statusInfo={license.statusInfo}
                    licenseActivatedAt={license.licenseActivatedAt}
                    licenseExpiresAt={license.licenseExpiresAt}
                    loading={license.loading}
                    formatLicenseDate={license.formatLicenseDate}
                    getGraceDate={license.getGraceDate}
                  />
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Alur Lisensi</h4>
                    <LicenseTimeline statusInfo={license.statusInfo} loading={license.loading} />
                  </div>
                </div>

                {/* Col 2: Actions + History */}
                <div className="lg:col-span-8 space-y-6">
                  <LicenseActions
                    updating={license.updating}
                    customDateInput={license.customDateInput}
                    setCustomDateInput={license.setCustomDateInput}
                    prepareLicenseUpdate={license.prepareLicenseUpdate}
                    showConfirm={license.showConfirm}
                    setShowConfirm={license.setShowConfirm}
                    pendingAction={license.pendingAction}
                    pendingExpiry={license.pendingExpiry}
                    executeLicenseUpdate={license.executeLicenseUpdate}
                  />
                  <Separator className="bg-white/5" />
                  <LicenseHistory
                    history={license.history}
                    loading={license.historyLoading}
                    onRefresh={license.fetchHistory}
                  />
                </div>
              </div>
            </Card>

            {/* Danger Zone: Reset Data Bisnis */}
            <Card className="bg-red-950/10 border border-red-500/30 rounded-[28px] p-6 shadow-2xl space-y-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="font-display font-black text-red-400 text-lg tracking-tight uppercase leading-none">Zona Bahaya: Reset Database Bisnis</h3>
                  <p className="text-[11px] text-red-500/80 font-bold uppercase tracking-wider mt-1">Hanya untuk Owner / Dev Superadmin</p>
                </div>
              </div>

              <Separator className="bg-red-500/20 my-2" />

              <div className="bg-black/30 p-4 rounded-2xl border border-red-500/10 space-y-4">
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

          {/* TAB 4: RECYCLE BIN DATA RECOVERY */}
          <TabsContent value="recycle" className="mt-0">
            <SembakoRecycleBin tenantId={tenant?.id || '00000000-0000-0000-0000-000000000002'} />
          </TabsContent>

        </Tabs>
      </main>

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
