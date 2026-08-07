import React from 'react'
import { ShieldAlert, LogOut, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { WA_URL } from '@/lib/constants/contact'

export default function LockedServerPage() {
  const { logout, tenant } = useAuth()

  const handleContactDev = () => {
    const businessName = tenant?.name || 'Toko Sembako'
    const message = encodeURIComponent(`Halo, saya ingin mengaktifkan kembali server bulanan Sembako OS untuk bisnis: ${businessName}`)
    window.open(`${WA_URL}?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0A07] px-4 py-12 relative overflow-hidden font-sans text-left">
      {/* Glow Effects */}
      <div className="absolute top-[10%] left-[-10%] w-[380px] h-[380px] rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[380px] h-[380px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#130E09] border border-red-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 relative z-10">
        
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10 animate-pulse">
          <ShieldAlert size={32} className="text-red-500" />
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Masa Aktif Server Berakhir
          </h1>
          <p className="text-xs text-[#A18E7E] leading-relaxed font-semibold">
            Akses ke dashboard dinonaktifkan sementara karena masa aktif bulanan server Anda telah berakhir pada tanggal 28.
          </p>
        </div>

        {/* Expiry Details Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-xs space-y-2.5 text-left font-semibold text-[#C4B5A5]">
          <div className="flex justify-between">
            <span className="opacity-75">Tipe Layanan</span>
            <span className="text-white font-bold">Langganan Bulanan Sembako OS</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Siklus Pembayaran</span>
            <span className="text-amber-500 font-bold">Setiap Tanggal 28</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Status Akses</span>
            <span className="text-red-500 font-bold flex items-center gap-1">
              Terkunci 🔒
            </span>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleContactDev}
            className="w-full h-11 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <MessageSquare size={16} />
            <span>Hubungi Developer via WhatsApp</span>
          </button>

          <button
            onClick={logout}
            className="w-full h-11 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <LogOut size={16} />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-[#786656] leading-relaxed pt-2 border-t border-white/[0.06] font-semibold">
          Hubungi Developer untuk mengaktifkan kembali lisensi server Anda.
        </p>

      </div>
    </div>
  )
}
