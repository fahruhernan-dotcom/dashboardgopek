import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { getOAuthRedirectUrl } from '@/lib/capacitor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Eye, EyeOff, AlertCircle, Loader2,
  TrendingUp, ShoppingCart, BarChart2, Clock, Shield, Users, Zap, Mail, Lock,
  Package, FileText, CheckCircle2, Crown, Store, UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { getBrokerBasePath, getPeternakBasePath, useAuth } from '../lib/hooks/useAuth'
import { logError } from '@/lib/logger/errorLogger'
import { setRememberMe as saveRememberMe } from '@/lib/supabaseStorage'
import { useLanguage } from '@/lib/i18n/useLanguage'

// Reactbits Components
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import Particles from '@/components/reactbits/Particles'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const { user, profile, loading: authLoading, isSuperadmin, loginAsRole } = useAuth()

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

  const handleQuickRoleFill = (roleKey) => {
    if (roleKey === 'dev') {
      setEmail('dev@sembako.id')
      setPassword('dev123')
    } else if (roleKey === 'owner') {
      setEmail('owner@sembako.id')
      setPassword('owner123')
    } else if (roleKey === 'admin') {
      setEmail('admin@sembako.id')
      setPassword('admin123')
    }
  }

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

    // Demo / Quick Role Bypasses
    if (cleanEmail === 'dev@sembako.id' || cleanEmail === 'dev') {
      loginAsRole('dev')
      toast.success('Masuk sebagai Developer!')
      navigate('/beranda')
      setIsLoading(false)
      return
    }
    if (cleanEmail === 'owner@sembako.id' || cleanEmail === 'owner') {
      loginAsRole('owner')
      toast.success('Masuk sebagai Owner Toko!')
      navigate('/beranda')
      setIsLoading(false)
      return
    }
    if (cleanEmail === 'admin@sembako.id' || cleanEmail === 'admin') {
      loginAsRole('admin')
      toast.success('Masuk sebagai Admin Kasir!')
      navigate('/beranda')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@sembako.id`,
        password: targetPass
      })

      if (error) {
        setError('Email atau password salah. Silakan coba lagi.')
        return
      }

      if (data.user?.app_metadata?.is_superadmin === true) {
        navigate('/admin')
        toast.success('Selamat datang kembali, Superadmin!')
        return
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*, tenants(sub_type, business_vertical)')
        .eq('auth_user_id', data.user.id)

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
    isLoading, error, handleLogin, handleQuickRoleFill, navigate,
    rememberMe, setRememberMe
  }

  if (!isDesktop) {
    return <MobileLoginView {...propsBag} />
  }

  return <DesktopLoginView {...propsBag} />
}

// ─── DESKTOP LOGIN VIEW ───────────────────────────────────────

function DesktopLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, handleQuickRoleFill, rememberMe, setRememberMe }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0D0A07', display: 'flex', color: '#FDF8F3', fontFamily: "'Sora', sans-serif", overflowX: 'hidden' }}>
      
      {/* BRAND HEADER (Absolute Left) */}
      <div style={{ position: 'absolute', top: 32, left: 48, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(234, 88, 12, 0.4)'
        }}>
          <ShoppingCart size={22} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            Gopek Sembako <span style={{ fontSize: 10, background: '#EA580C', color: '#FFF', padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 0.5 }}>OS v2.0</span>
          </div>
          <div style={{ fontSize: 11, color: '#A18E7E', fontWeight: 500 }}>Dashboard Distributor & Broker Sembako</div>
        </div>
      </div>

      {/* LEFT PANEL - SEMBAKO BRANDING */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '50%', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '120px 48px 48px 48px',
          background: 'radial-gradient(circle at 20% 20%, rgba(234, 88, 12, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(217, 119, 6, 0.12) 0%, transparent 50%), linear-gradient(135deg, #0D0A07 0%, #16100A 100%)'
        }}
      >
        {/* Glow Effects */}
        <div style={{
          position: 'absolute', top: '15%', left: '-10%',
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.14) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none'
        }} />

        <Particles
          particleCount={60}
          particleColors={['#EA580C', '#F59E0B', '#F97316', '#FCD34D']}
          particleBaseSize={2}
          speed={0.25}
          className="absolute inset-0 pointer-events-none"
        />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 520, margin: '0 auto' }}>
          
          <h2 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.5px', color: '#FFFFFF', marginBottom: 12 }}>
            Kelola Operasional Sembako Lebih Cepat & Akurat.
          </h2>
          <p style={{ fontSize: 14, color: '#C4B5A5', lineHeight: 1.6, marginBottom: 32 }}>
            Sistem manajemen POS toko, kasir grosir, kontrol stok gudang FIFO, dan transparansi laporan profit bersih real-time.
          </p>

          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { icon: <Clock size={16} color="#F97316" />, val: "< 1 Detik", label: "Cetak POS & Faktur" },
              { icon: <Package size={16} color="#F59E0B" />, val: "FIFO Stok", label: "Gudang & Batch Expired" },
              { icon: <Shield size={16} color="#10B981" />, val: "3 Role", label: "Dev, Owner & Admin" },
            ].map((st, i) => (
              <div 
                key={i} 
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14, padding: '14px', backdropFilter: 'blur(12px)'
                }}
              >
                {st.icon}
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginTop: 6 }}>{st.val}</div>
                <div style={{ fontSize: 11, color: '#A18E7E', marginTop: 2 }}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* FEATURE GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
            {[
              { icon: <ShoppingCart size={15} color="#EA580C" />, title: "Kasir & Multi-Toko", desc: "Transaksi POS grosir kilat dengan opsi nota termal." },
              { icon: <Package size={15} color="#F59E0B" />, title: "Stok FIFO Gudang", desc: "Kontrol varian dus/bal & penyesuaian stok otomatis." },
              { icon: <TrendingUp size={15} color="#10B981" />, title: "Margin & Profit", desc: "Hitung otomatis keuntungan bersih dikurangi HPP." },
              { icon: <FileText size={15} color="#3B82F6" />, title: "Log Audit Perubahan", desc: "Rekam setiap perubahan stok untuk keamanan transaksi." },
            ].map((ft, i) => (
              <div 
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 14, padding: '14px', backdropFilter: 'blur(12px)'
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(234, 88, 12, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  {ft.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ft.title}</div>
                <div style={{ fontSize: 11, color: '#A18E7E', marginTop: 3, lineHeight: 1.4 }}>{ft.desc}</div>
              </div>
            ))}
          </div>

          {/* TESTIMONIAL CARD */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
            border: '1px solid rgba(234, 88, 12, 0.2)',
            borderLeft: '4px solid #EA580C',
            borderRadius: 14, padding: '16px', backdropFilter: 'blur(12px)'
          }}>
            <p style={{ fontSize: 12, italic: true, color: '#E5D5C5', lineHeight: 1.6 }}>
              "Pencatatan grosir sembako dan piutang toko jadi sangat rapi. Selisih stok kasir otomatis terlacak dari log perubahan."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 99, background: '#EA580C', color: '#FFF', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                HS
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>H. Subagyo</div>
                <div style={{ fontSize: 10, color: '#A18E7E' }}>Distributor Sembako Jaya, Surabaya</div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', background: '#080604', borderLeft: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#130E09', border: '1px solid rgba(234, 88, 12, 0.22)', borderRadius: 24, padding: 36, boxShadow: '0 24px 60px rgba(0,0,0,0.7)', position: 'relative' }}>
          
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', color: '#FFF', marginBottom: 6 }}>
              Selamat Datang Kembali
            </h1>
            <p style={{ fontSize: 13, color: '#A18E7E', lineHeight: 1.5 }}>
              Masukkan email dan password terdaftar untuk mengakses Dashboard Sembako OS.
            </p>
          </div>

          {/* QUICK ROLE SELECTOR BADGES */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={12} /> Pilih Mode Akses Login Cepat:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { role: 'dev', label: 'Dev Mode', icon: <Crown size={12} color="#F59E0B" />, bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
                { role: 'owner', label: 'Owner Toko', icon: <Store size={12} color="#10B981" />, bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
                { role: 'admin', label: 'Admin Kasir', icon: <UserCheck size={12} color="#3B82F6" />, bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
              ].map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => {
                    handleQuickRoleFill(r.role)
                    handleLogin(r.role === 'dev' ? 'dev@sembako.id' : r.role === 'owner' ? 'owner@sembako.id' : 'admin@sembako.id', r.role + '123')
                  }}
                  style={{
                    padding: '8px 6px', borderRadius: 10, background: r.bg, border: `1px solid ${r.border}`,
                    color: '#FFF', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'transform 120ms, background 120ms'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
            <span style={{ fontSize: 11, color: '#786656', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>atau login email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* EMAIL FIELD */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#C4B5A5', marginBottom: 8 }}>
                Email Akun
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#786656" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Ketik email Anda (contoh: owner@sembako.id)"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-[#1C130A] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#EA580C] placeholder:text-white/20 transition-all box-border"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#C4B5A5' }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#786656" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 px-11 bg-[#1C130A] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#EA580C] placeholder:text-white/20 transition-all box-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#786656', display: 'flex', padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#EA580C', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: 12, color: '#A18E7E', cursor: 'pointer' }}>
                Ingat sesi login saya
              </label>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 10,
                fontSize: 12, color: '#F87171', display: 'flex', gap: 8, alignItems: 'center'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              style={{
                width: '100%', height: 46, marginTop: 8,
                background: isLoading || !email || !password ? 'rgba(234, 88, 12, 0.4)' : 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)',
                border: 'none', borderRadius: 12, color: '#FFF',
                fontSize: 14, fontWeight: 800, cursor: isLoading || !email || !password ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isLoading || !email || !password ? 'none' : '0 6px 24px rgba(234, 88, 12, 0.35)',
                transition: 'all 150ms'
              }}
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Memproses Login...</>
              ) : (
                <>Masuk ke Dashboard</>
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.06)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#786656', lineHeight: 1.5 }}>
              Akses akun terenkripsi & dikelola secara terpusat oleh <strong style={{ color: '#EA580C' }}>Developer Superadmin</strong>.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── MOBILE LOGIN VIEW ────────────────────────────────────────

function MobileLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, handleQuickRoleFill, rememberMe, setRememberMe }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0D0A07', padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#FFF', fontFamily: "'Sora', sans-serif" }}>
      
      {/* BRAND HEADER MOBILE */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, margin: '0 auto 12px',
          background: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(234, 88, 12, 0.4)'
        }}>
          <ShoppingCart size={28} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Gopek Sembako <span style={{ fontSize: 10, background: '#EA580C', color: '#FFF', padding: '2px 8px', borderRadius: 99, verticalAlign: 'middle' }}>OS v2.0</span>
        </h1>
        <p style={{ fontSize: 12, color: '#A18E7E' }}>Dashboard Distributor & Broker Sembako</p>
      </div>

      {/* FORM CARD */}
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', background: '#130E09', border: '1px solid rgba(234, 88, 12, 0.22)', borderRadius: 20, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
        
        {/* QUICK ROLE SELECTOR */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={12} /> Pilih Role Login Cepat:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { role: 'dev', label: 'Dev', icon: <Crown size={11} color="#F59E0B" />, bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
              { role: 'owner', label: 'Owner', icon: <Store size={11} color="#10B981" />, bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
              { role: 'admin', label: 'Admin', icon: <UserCheck size={11} color="#3B82F6" />, bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
            ].map(r => (
              <button
                key={r.role}
                type="button"
                onClick={() => {
                  handleQuickRoleFill(r.role)
                  handleLogin(r.role === 'dev' ? 'dev@sembako.id' : r.role === 'owner' ? 'owner@sembako.id' : 'admin@sembako.id', r.role + '123')
                }}
                style={{
                  padding: '7px 4px', borderRadius: 8, background: r.bg, border: `1px solid ${r.border}`,
                  color: '#FFF', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                }}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#C4B5A5', marginBottom: 6 }}>
              Email Akun
            </label>
            <input
              type="text"
              placeholder="Ketik email Anda (contoh: owner@sembako.id)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-11 px-3 bg-[#1C130A] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#EA580C] placeholder:text-white/20 transition-all box-border"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#C4B5A5', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-11 pl-3 pr-10 bg-[#1C130A] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#EA580C] placeholder:text-white/20 transition-all box-border"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#786656', padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 8, fontSize: 11, color: '#F87171' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            style={{
              width: '100%', height: 44, marginTop: 4,
              background: isLoading || !email || !password ? 'rgba(234, 88, 12, 0.4)' : 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)',
              border: 'none', borderRadius: 10, color: '#FFF',
              fontSize: 14, fontWeight: 800, cursor: 'pointer'
            }}
          >
            {isLoading ? 'Memproses...' : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#786656' }}>
            Akses dikelola terpusat oleh Developer.
          </p>
        </div>

      </div>
    </div>
  )
}
