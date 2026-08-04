import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCw, 
  X, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Type
} from 'lucide-react'
import { DevicePreviewContext } from '@/lib/context/DevicePreviewContext'

const DEVICE_PRESETS = {
  desktop: {
    id: 'desktop',
    name: 'Laptop / Desktop',
    width: '100%',
    height: '100%',
    icon: Monitor,
    defaultFontScale: 100,
  },
  tablet: {
    id: 'tablet',
    name: 'Tablet (iPad)',
    width: 768,
    height: 1024,
    icon: Tablet,
    defaultFontScale: 95,
  },
  mobile: {
    id: 'mobile',
    name: 'HP (Smartphone)',
    width: 375,
    height: 812,
    icon: Smartphone,
    defaultFontScale: 90,
  },
}

export default function DevicePreviewShell({ children }) {
  const [mode, setMode] = useState('desktop')
  const [isLandscape, setIsLandscape] = useState(false)
  const [scale, setScale] = useState(1)
  const [fontScale, setFontScale] = useState(100)
  const [autoScale, setAutoScale] = useState(true)
  const [isOpen, setIsOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const activePreset = DEVICE_PRESETS[mode]
  const isFrameActive = mode !== 'desktop'

  // Update font scale automatically when mode changes
  const handleModeChange = (newMode) => {
    setMode(newMode)
    setFontScale(DEVICE_PRESETS[newMode].defaultFontScale)
  }

  // Calculate dimensions based on orientation
  const width = isFrameActive 
    ? (isLandscape ? activePreset.height : activePreset.width) 
    : '100%'
  const height = isFrameActive 
    ? (isLandscape ? activePreset.width : activePreset.height) 
    : '100%'

  const simulatedWidth = isFrameActive ? (typeof width === 'number' ? width : null) : null

  // Auto-scale calculation when frame exceeds screen height
  useEffect(() => {
    if (!isFrameActive || !autoScale) {
      setScale(1)
      return
    }

    const handleResize = () => {
      const availHeight = window.innerHeight - 140 // Leave margin for floating bar
      const availWidth = window.innerWidth - 60
      
      const targetW = typeof width === 'number' ? width : window.innerWidth
      const targetH = typeof height === 'number' ? height : window.innerHeight

      const scaleH = availHeight / targetH
      const scaleW = availWidth / targetW
      
      const computedScale = Math.min(scaleH, scaleW, 1)
      setScale(Math.max(computedScale, 0.55))
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mode, isLandscape, isFrameActive, autoScale, width, height])

  return (
    <DevicePreviewContext.Provider value={{ mode, simulatedWidth }}>
      <div className="relative min-h-screen w-full bg-[#06090F] overflow-x-hidden">
        {/* ── Main App Content Container ── */}
        {isFrameActive ? (
          <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-md transition-all duration-300">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: scale }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                width: `${width}px`,
                height: `${height}px`,
              }}
              className="relative flex-shrink-0 bg-background rounded-[40px] border-[10px] border-[#1C2530] shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300"
            >
              {/* Device Frame Top Notch / Speaker Header */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-[#1C2530] z-50 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-4 bg-[#0B0F15] rounded-b-xl flex items-center justify-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1C2530]" />
                  <div className="w-8 h-1 bg-[#1C2530] rounded-full" />
                </div>
              </div>

              {/* Simulated App Viewport Scroll Container */}
              <div 
                className="w-full h-full pt-6 overflow-y-auto overflow-x-hidden bg-background transition-all"
                style={{ fontSize: `${fontScale}%` }}
              >
                {children}
              </div>

              {/* Device Home Indicator Bar at Bottom */}
              <div className="absolute bottom-1 left-0 right-0 h-3 flex items-center justify-center pointer-events-none z-50">
                <div className="w-32 h-1 bg-slate-500/40 rounded-full" />
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="w-full min-h-screen">
            {children}
          </div>
        )}

        {/* ── Floating Device Toolbar Controls ── */}
        <div className="fixed bottom-4 right-4 sm:right-6 z-[9999] font-sans">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="bg-[#0C1319]/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden p-2 text-slate-200"
              >
                {/* Header Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 text-xs font-bold text-slate-400 select-none">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Sparkles size={13} />
                    <span className="tracking-wide">SIMULATOR LAYAR</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsCollapsed(v => !v)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title={isCollapsed ? "Expand Toolbar" : "Collapse Toolbar"}
                    >
                      {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        handleModeChange('desktop')
                        setIsOpen(false)
                      }}
                      className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
                      title="Tutup Preview"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-2 flex flex-col gap-2">
                    {/* Preset Buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {Object.values(DEVICE_PRESETS).map(preset => {
                        const Icon = preset.icon
                        const isActive = mode === preset.id
                        return (
                          <button
                            key={preset.id}
                            onClick={() => handleModeChange(preset.id)}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all select-none cursor-pointer ${
                              isActive
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold shadow-sm'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                          >
                            <Icon size={18} className="mb-1" />
                            <span className="text-[11px] font-semibold">{preset.name.split(' ')[0]}</span>
                            <span className="text-[9px] opacity-60 font-mono mt-0.5">{preset.id === 'desktop' ? 'Full' : preset.width}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Frame Controls & Font Scaling */}
                    {isFrameActive && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80 text-xs">
                        {/* Orientation Rotate & Frame Scale */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => setIsLandscape(v => !v)}
                            className={`flex-1 py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 text-[11px] font-medium transition-all ${
                              isLandscape
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <RotateCw size={12} className={isLandscape ? 'rotate-90 transition-transform' : ''} />
                            <span>{isLandscape ? 'Landscape' : 'Portrait'}</span>
                          </button>

                          <div className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400" title="Skala Layar Frame">
                            {Math.round(scale * 100)}% Layar
                          </div>
                        </div>

                        {/* Font Size Adjuster Controls */}
                        <div className="flex items-center justify-between gap-1.5 bg-slate-900/90 border border-slate-800/90 p-1.5 rounded-xl text-[11px]">
                          <div className="flex items-center gap-1 text-slate-400 px-1">
                            <Type size={13} />
                            <span className="font-medium text-[10px]">Font:</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setFontScale(s => Math.max(s - 5, 75))}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-md font-bold text-slate-300 transition-colors"
                              title="Kecilkan Ukuran Teks"
                            >
                              A-
                            </button>

                            <span className="px-1.5 font-mono font-bold text-amber-400 text-[10px]">
                              {fontScale}%
                            </span>

                            <button
                              onClick={() => setFontScale(s => Math.min(s + 5, 125))}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-md font-bold text-slate-300 transition-colors"
                              title="Besarkan Ukuran Teks"
                            >
                              A+
                            </button>

                            <button
                              onClick={() => setFontScale(activePreset.defaultFontScale)}
                              className="px-1.5 py-0.5 bg-slate-800/60 hover:bg-slate-700 text-[9px] text-slate-400 rounded-md transition-colors ml-1"
                              title="Reset Ukuran Font"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Mini Toggle Button (when minimized or closed) */}
          {!isOpen && (
            <motion.button
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-full shadow-xl cursor-pointer border border-amber-300/40 select-none"
            >
              <Sparkles size={14} />
              <span>Device Simulator</span>
            </motion.button>
          )}
        </div>
      </div>
    </DevicePreviewContext.Provider>
  )
}
