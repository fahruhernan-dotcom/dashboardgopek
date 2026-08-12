import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  Eye, EyeOff, AlertCircle, Loader2,
  TrendingUp, ShoppingCart, Clock, Shield, Users, Zap, Mail, Lock,
  Package, FileText, Crown, Store, UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { getBrokerBasePath, getPeternakBasePath, useAuth } from '../lib/hooks/useAuth'
import { setRememberMe as saveRememberMe } from '@/lib/supabaseStorage'
import Particles from '@/components/reactbits/Particles'
import { cn } from '@/lib/utils'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const { user, profile, loading: authLoading, isSuperadmin } = useAuth()

  useEffect(() => {
    if (authLoading || !user || !profile) return
    if (isSuperadmin) { navigate('/admin', { replace: true }); return }
    if (!profile.onboarded) { navigate('/onboarding', { replace: true }); return }
    if (profile.user_type === 'peternak' || profile.user_type === 'rumah_potong') {
      navigate(getPeternakBasePath(profile.tenants, profile) + '/beranda', { replace: true })
      return
    }
    navigate(getBrokerBasePath(profile.tenants, profile) + '/beranda', { replace: true })
  }, [authLoading, user, profile, isSuperadmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (overrideEmail, overridePass) => {
    const targetEmail = overrideEmail || email
    const targetPass = overridePass || password

    if (!targetEmail || !targetPass) {
      setError('Masukkan email dan password kamu')
      return
    }
    setIsLoading(true)
    setError('')
    saveRememberMe(rememberMe)

    const cleanEmail = targetEmail.trim().toLowerCase()

    try {
      let resolvedEmail = cleanEmail
      if (!cleanEmail.includes('@')) {
        const { data: matchedProf } = await supabase
          .from('profiles')
          .select('email')
          .ilike('email', `${cleanEmail}%`)
          .limit(1)
          .maybeSingle()

        resolvedEmail = matchedProf?.email || `${cleanEmail}@sembako.id`
      }

      let { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: targetPass
      })

      if (error && !cleanEmail.includes('@') && resolvedEmail !== `${cleanEmail}@sembako.id`) {
        const fallbackRes = await supabase.auth.signInWithPassword({
          email: `${cleanEmail}@sembako.id`,
          password: targetPass
        })
        data = fallbackRes.data
        error = fallbackRes.error
      }

      if (error) {
        setError('Email atau password salah. Silakan coba lagi.')
        return
      }

      if (data.user?.app_metadata?.is_superadmin === true) {
        navigate('/admin')
        toast.success('Selamat datang kembali, Superadmin!')
        return
      }

      let { data: profiles } = await supabase
        .from('profiles')
        .select('*, tenants(sub_type, business_vertical)')
        .eq('auth_user_id', data.user.id)

      if (!profiles || profiles.length === 0) {
        const { data: profilesByEmail } = await supabase
          .from('profiles')
          .select('*, tenants(sub_type, business_vertical)')
          .eq('email', cleanEmail)

        if (profilesByEmail && profilesByEmail.length > 0) {
          profiles = profilesByEmail
          await supabase.from('profiles').update({ auth_user_id: data.user.id }).eq('id', profilesByEmail[0].id)
        } else if (cleanEmail === 'fahruhernansakti@gmail.com' || cleanEmail.startsWith('dev@')) {
          const defaultTenantId = '00000000-0000-0000-0000-000000000002'
          const { data: newProfile } = await supabase.from('profiles').insert({
            auth_user_id: data.user.id,
            tenant_id: defaultTenantId,
            full_name: data.user.user_metadata?.full_name || 'Developer Superadmin',
            email: cleanEmail,
            role: 'dev',
            app_role: 'dev',
            user_type: 'broker',
            sub_type: 'distributor_sembako',
            business_name: 'Broker Dashboard Sembako',
            onboarded: true
          }).select('*, tenants(sub_type, business_vertical)').single()

          if (newProfile) profiles = [newProfile]
        }
      }

      if (!profiles || profiles.length === 0) {
        setError('Akun tidak terdaftar. Hubungi Developer untuk mendaftarkan akun.')
        await supabase.auth.signOut()
        return
      }

      const profile = profiles.find(p => p.onboarded) || profiles[0]

      if (profile?.tenant_id) {
        try { localStorage.setItem('ternakos_active_tenant_id', profile.tenant_id) } catch { /* ok */ }
      }

      navigate(getBrokerBasePath(profile.tenants, profile) + '/beranda')
      toast.success('Selamat datang kembali!')
    } catch (err) {
      setError('Terjadi kesalahan saat masuk. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const propsBag = {
    email, setEmail, password, setPassword, showPassword, setShowPassword,
    isLoading, error, handleLogin, navigate,
    rememberMe, setRememberMe
  }

  if (!isDesktop) {
    return <MobileLoginView {...propsBag} />
  }

  return <DesktopLoginView {...propsBag} />
}

// ─── DESKTOP LOGIN VIEW ───────────────────────────────────────
function DesktopLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, rememberMe, setRememberMe }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans selection:bg-orange-500/30 overflow-hidden relative text-left">
      
      {/* BRAND HEADER (Absolute Left) */}
      <div className="absolute top-8 left-12 z-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
          <ShoppingCart size={20} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-extrabold text-sm text-foreground flex items-center gap-2">
            Gopek Sembako <span className="text-[10px] bg-orange-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">OS v2.0</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Dashboard Distributor & Broker</div>
        </div>
      </div>

      {/* LEFT PANEL - SEMBAKO BRANDING */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-1/2 relative overflow-hidden hidden lg:flex flex-col justify-center px-16 py-20 bg-slate-50 dark:bg-slate-950/20 border-r border-border/40"
      >
        <div className="absolute top-[15%] left-[-10%] w-[380px] h-[380px] rounded-full bg-radial-gradient from-orange-500/10 to-transparent blur-3xl pointer-events-none" />

        <Particles
          particleCount={50}
          particleColors={['#EA580C', '#F59E0B', '#F97316', '#FCD34D']}
          particleBaseSize={2}
          speed={0.2}
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-75"
        />

        <div className="relative z-10 w-full max-w-[500px] mx-auto space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-black leading-tight text-foreground">
              Kelola Operasional Sembako Lebih Cepat & Akurat.
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground font-semibold">
              Sistem manajemen POS toko, kasir grosir, kontrol stok gudang FIFO, dan transparansi laporan profit bersih real-time.
            </p>
          </div>

          {/* STATS ROW */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Clock size={16} className="text-orange-500" />, val: "< 1 Detik", label: "Cetak POS & Faktur" },
              { icon: <Package size={16} className="text-amber-500" />, val: "FIFO Stok", label: "Gudang & Batch" },
              { icon: <Shield size={16} className="text-emerald-500" />, val: "3 Role", label: "Dev, Owner & Admin" },
            ].map((st, i) => (
              <div 
                key={i} 
                className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm"
              >
                {st.icon}
                <div className="text-sm font-black text-foreground mt-2">{st.val}</div>
                <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>

          {/* FEATURE GRID */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <ShoppingCart size={14} className="text-orange-500" />, title: "Kasir & Multi-Toko", desc: "Transaksi POS grosir kilat dengan nota termal." },
              { icon: <Package size={14} className="text-amber-500" />, title: "Stok FIFO Gudang", desc: "Kontrol varian dus/bal & penyesuaian stok." },
              { icon: <TrendingUp size={14} className="text-emerald-500" />, title: "Margin & Profit", desc: "Hitung otomatis laba bersih dikurangi HPP." },
              { icon: <FileText size={14} className="text-blue-500" />, title: "Log Audit Perubahan", desc: "Rekam setiap perubahan stok untuk keamanan." },
            ].map((ft, i) => (
              <div 
                key={i}
                className="bg-card border border-border/40 rounded-2xl p-4 shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                  {ft.icon}
                </div>
                <div className="text-xs font-black text-foreground">{ft.title}</div>
                <div className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed font-semibold">{ft.desc}</div>
              </div>
            ))}
          </div>

          {/* TESTIMONIAL CARD */}
          <div className="bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/20 border-l-4 border-l-orange-500 rounded-2xl p-4 backdrop-blur-sm shadow-sm">
            <p className="text-[11px] italic text-foreground/80 leading-relaxed font-semibold">
              "Pencatatan grosir sembako dan piutang toko jadi sangat rapi. Selisih stok kasir otomatis terlacak dari log perubahan."
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-7 h-7 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center">
                HS
              </div>
              <div>
                <div className="text-[11px] font-black text-foreground">H. Subagyo</div>
                <div className="text-[9px] text-muted-foreground font-semibold">Distributor Sembako Jaya, Surabaya</div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background border-l border-border/40">
        <div className="w-full max-w-[420px] bg-card border border-border/60 rounded-3xl p-8 sm:p-10 shadow-xl relative">
          
          <div className="mb-6">
            <h1 className="text-2xl font-black text-foreground mb-1.5">
              Selamat Datang Kembali
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Masukkan email dan password terdaftar untuk mengakses Dashboard Sembako OS.
            </p>
          </div>



          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            
            {/* EMAIL FIELD */}
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
                Email Akun
              </label>
              <div className="relative">
                <Mail size={16} className="text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik email Anda (contoh: owner@sembako.id)"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-white/[0.02] border border-border/60 rounded-xl text-foreground text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 placeholder:text-muted-foreground/40 transition-all box-border"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-slate-50 dark:bg-white/[0.02] border border-border/60 rounded-xl text-foreground text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 placeholder:text-muted-foreground/40 transition-all box-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground cursor-pointer flex p-0 border-none bg-transparent"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-orange-600 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-muted-foreground font-semibold cursor-pointer">
                Ingat sesi login saya
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 dark:text-red-400 flex gap-2 items-center">
                <AlertCircle size={15} className="shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 hover:from-orange-500 hover:to-amber-500 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Memproses...</>
              ) : (
                <>Masuk ke Dashboard</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/40 text-center">
            <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
              Akses akun terenkripsi & dikelola secara terpusat oleh <strong className="text-orange-600 dark:text-orange-500">Developer Superadmin</strong>.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── MOBILE LOGIN VIEW ────────────────────────────────────────
function MobileLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, rememberMe, setRememberMe }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans px-4 py-8 flex flex-col justify-center text-left">
      
      {/* BRAND HEADER MOBILE */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mx-auto mb-3">
          <ShoppingCart size={24} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-black text-foreground flex items-center justify-center gap-1.5">
          Gopek Sembako <span className="text-[9px] bg-orange-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">OS v2.0</span>
        </h1>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Dashboard Distributor & Broker</p>
      </div>

      {/* FORM CARD */}
      <div className="w-full max-w-[360px] mx-auto bg-card border border-border/60 rounded-3xl p-6 shadow-xl">
        


        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          
          <div>
            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
              Email Akun
            </label>
            <input
              type="text"
              placeholder="Ketik email Anda (contoh: owner@sembako.id)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 bg-slate-555 dark:bg-white/[0.02] border border-border/60 rounded-xl text-foreground text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 placeholder:text-muted-foreground/40 transition-all box-border"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-11 pl-3.5 pr-10 bg-slate-555 dark:bg-white/[0.02] border border-border/60 rounded-xl text-foreground text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 placeholder:text-muted-foreground/40 transition-all box-border"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground cursor-pointer flex p-0 border-none bg-transparent"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border/60 text-orange-600 focus:ring-orange-500/30 accent-orange-600 cursor-pointer"
              />
              <span>Ingat Sesi Saya</span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 dark:text-red-400 flex gap-2 items-center">
              <AlertCircle size={14} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 hover:from-orange-500 hover:to-amber-500 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Memproses...' : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[10px] text-muted-foreground font-semibold">
            Akses dikelola terpusat oleh Developer.
          </p>
        </div>

      </div>
    </div>
  )
}
