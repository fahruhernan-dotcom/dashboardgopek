import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users, Shield, Menu } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import Tim from './Tim'

/**
 * ManajemenPage — shared tabbed wrapper untuk semua role.
 *
 * Props:
 *   roleConfig   — config dari timConfigs.js (accent, roleBadgeMap, dll)
 *   workerTab    — { id, label, icon, component: WorkerComponent }
 *                  Jika tidak diisi → langsung render Tim tanpa tab.
 */
export default function ManajemenPage({ roleConfig, workerTab }) {
  const { setSidebarOpen } = useOutletContext() || {}
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const TABS = [
    ...(workerTab
      ? [{ id: workerTab.id, label: workerTab.label, icon: workerTab.icon || Users, desc: 'Pekerja & gaji' }]
      : []),
    { id: 'tim', label: 'Tim & Akses', icon: Shield, desc: 'Anggota & undangan' },
  ]

  const [activeTab, setActiveTab] = useState(workerTab ? workerTab.id : 'tim')

  const rgb = roleConfig?.accentRgb || '16, 185, 129' // Fallback to emerald
  const activeStyle = {
    backgroundColor: `rgba(${rgb}, 0.15)`,
    borderColor: `rgba(${rgb}, 0.25)`,
    color: `rgb(${rgb})`,
  }
  const inactiveStyle = {
    borderColor: 'transparent',
    color: '#4B6478',
  }

  // If no workerTab → render Tim directly without any tab chrome
  if (!workerTab) {
    return <Tim roleConfig={roleConfig} />
  }

  const WorkerComponent = workerTab.component

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#06090F' }}>
      {/* Mobile sticky header */}
      {!isDesktop && (
        <header className="sticky top-0 z-30 backdrop-blur-md border-b border-white/5 pt-[env(safe-area-inset-top,0px)]"
          style={{ background: 'rgba(6,9,15,0.90)' }}>
          <div className="h-14 px-4 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen?.(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform bg-white/[0.03] border border-white/[0.06]"
            >
              <Menu size={18} style={{ color: `rgb(${rgb})` }} />
            </button>
            <div className="flex gap-1.5 bg-white/[0.02] border border-white/[0.04] rounded-xl p-1 flex-1">
              {TABS.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border',
                      active ? 'font-extrabold shadow-sm' : 'border-transparent text-[#4B6478] hover:text-white/60'
                    )}
                    style={active ? activeStyle : inactiveStyle}
                  >
                    <Icon size={12} />
                    <span className="hidden xs:inline">{tab.label.split(' ')[0]}</span>
                    <span>{tab.label.split(' ').slice(-1)[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </header>
      )}

      {/* Desktop tab bar */}
      {isDesktop && (
        <div className="px-8 pt-8">
          <div className="inline-flex bg-white/[0.02] border border-white/[0.04] p-1 rounded-xl">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all border',
                    active ? 'font-extrabold shadow-sm' : 'text-[#4B6478] hover:text-slate-300'
                  )}
                  style={active ? activeStyle : inactiveStyle}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === workerTab?.id && <WorkerComponent hideMobileHeader />}
        {activeTab === 'tim' && <Tim roleConfig={roleConfig} hideMobileHeader />}
      </div>
    </div>
  )
}
