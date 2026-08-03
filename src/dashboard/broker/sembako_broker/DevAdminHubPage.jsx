import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, ShieldCheck, Users, Activity, Trash2, RefreshCw, 
  Search, AlertTriangle, CheckCircle2, Cpu, Database, 
  KeyRound, ShieldAlert, Layers, Zap, HardDrive, Wifi, Server,
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

export default function DevAdminHubPage() {
  const { user, profile, tenant } = useAuth()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('logs')
  const [dbLatency, setDbLatency] = useState(null)
  const [isCheckingPing, setIsCheckingPing] = useState(false)
  const [copiedLogId, setCopiedLogId] = useState(null)

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
  }, [])

  const handleClearLogs = () => {
    setSystemLogs([])
    localStorage.removeItem('ternakos_dev_logs')
    toast.success('Logs konsol berhasil dibersihkan')
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
          </TabsContent>

          {/* TAB 4: RECYCLE BIN DATA RECOVERY */}
          <TabsContent value="recycle" className="mt-0">
            <SembakoRecycleBin tenantId={tenant?.id || '00000000-0000-0000-0000-000000000002'} />
          </TabsContent>

        </Tabs>
      </main>

    </div>
  )
}
