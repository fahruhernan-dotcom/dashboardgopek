import React from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  ShieldCheck, Users, Trash2, Cpu, Activity, 
  Store, Server, LayoutDashboard, Sparkles, ChevronRight, Zap, Layers, Lock
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export default function SuperadminLayout() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="bg-[#0B0F17] min-h-screen flex flex-col font-sans text-slate-100 selection:bg-orange-500/30 selection:text-orange-200 antialiased">
      
      {/* High-End Sleek Topbar */}
      <header className="relative z-40 bg-[#111726] border-b border-slate-800/80 px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        
        {/* Brand & Mode Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700 p-[1px] shadow-lg shadow-orange-950/30 shrink-0">
            <div className="w-full h-full bg-[#111726] rounded-[15px] flex items-center justify-center">
              <ShieldCheck size={20} className="text-orange-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
                Superadmin Control Center
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" /> System Command
              </span>
            </div>
            <h1 className="font-display text-base font-extrabold text-white tracking-tight pt-0.5">
              Pusat Kontrol Web Admin
            </h1>
          </div>
        </div>

        {/* Switcher Button: Back to Client View */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate('/beranda')}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs h-10 px-4 gap-2 shadow-lg shadow-emerald-950/30 border border-emerald-400/20 active:scale-[0.98] transition-all group"
          >
            <Store size={15} className="text-emerald-200" />
            <span>Switch ke Bisnis Client</span>
            <ChevronRight size={14} className="text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex relative z-10">
        
        {/* Sleek Admin Sidebar */}
        <aside className="w-64 bg-[#111726] border-r border-slate-800/80 p-5 flex flex-col justify-between hidden md:flex shrink-0">
          <div className="space-y-6">
            
            <div className="px-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Navigasi Utama</p>
            </div>

            <nav className="space-y-1.5">
              <AdminNavItem 
                to="/admin/dashboard" 
                icon={LayoutDashboard} 
                label="Overview Admin" 
                active={location.pathname === '/admin/dashboard' && !location.search} 
              />
              <AdminNavItem 
                to="/admin/dashboard?tab=accounts" 
                icon={Users} 
                label="Kelola Akun Login" 
                active={location.search.includes('tab=accounts')} 
              />
              <AdminNavItem 
                to="/admin/dashboard?tab=logs" 
                icon={Activity} 
                label="System Error Logs" 
                active={location.search.includes('tab=logs')} 
              />
              <AdminNavItem 
                to="/admin/dashboard?tab=diagnostics" 
                icon={Cpu} 
                label="Diagnostics & Cache" 
                active={location.search.includes('tab=diagnostics')} 
              />
              <AdminNavItem 
                to="/admin/dashboard?tab=recycle" 
                icon={Trash2} 
                label="Recycle Bin Recovery" 
                active={location.search.includes('tab=recycle')} 
              />
            </nav>
          </div>

          {/* Admin Profile Footbar */}
          <div className="bg-[#172033] p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
            <Avatar className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40">
              <AvatarFallback className="bg-transparent text-orange-400 font-bold text-xs">
                {(profile?.full_name || 'SA')?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {profile?.full_name || 'Superadmin'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 truncate">
                {user?.email || 'dev@sembako.id'}
              </p>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

function AdminNavItem({ to, icon: Icon, label, active }) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all group duration-150",
        active 
          ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white font-extrabold shadow-lg shadow-orange-950/40 border border-orange-400/30" 
          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
      )}
    >
      <Icon size={17} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
      <span>{label}</span>
    </Link>
  )
}
