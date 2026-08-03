import React, { useState, useMemo } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { motion } from 'framer-motion'
import { Users, Plus, DollarSign, CalendarCheck, Check, Lock } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import {
  useSembakoEmployees, useSembakoPayrolls,
  useCreateSembakoEmployee, useUpdateSembakoEmployee,
  useRecordPayroll, useMarkPayrollPaid,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import {
  C, sInput, sBtn, sLabel, fmtDate, InputRupiah, CustomSelect,
} from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'

const SALARY_TYPES = [
  { value: 'harian', label: 'Harian', color: '#60A5FA' },
  { value: 'bulanan', label: 'Bulanan', color: C.green },
  { value: 'borongan', label: 'Borongan', color: C.amber },
  { value: 'komisi', label: 'Komisi', color: '#A78BFA' },
  { value: 'campuran', label: 'Campuran', color: C.accent },
]
const STATUS_COLOR = { aktif: C.green, nonaktif: C.red, cuti: C.amber }
const ROLES = ['gudang', 'sales', 'kurir', 'admin', 'lainnya']

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function SembakoPegawai({ hideMobileHeader }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const { tenant } = useAuth()
  const sub = getSubscriptionStatus(tenant)
  const isStarter = sub.status !== 'active' && sub.status !== 'trial'
  const [tab, setTab] = useState('pegawai')

  if (isStarter) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        {(!isDesktop && !hideMobileHeader) && <BrokerMobileHeader title="Pegawai" onMenuClick={() => setSidebarOpen(true)} />}
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.25)' }}>
            <Lock size={28} style={{ color: '#EA580C' }} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
              style={{ background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.2)' }}>
              <Users size={11} style={{ color: '#EA580C' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#EA580C' }}>Fitur Pro</span>
            </div>
            <h2 className="font-display font-black text-xl text-white mb-2">Karyawan & Payroll</h2>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: '#64748B' }}>
              Kelola data karyawan, jadwal gaji, dan rekap payroll tersedia di plan{' '}
              <span className="text-white font-bold">Pro</span> dan <span className="text-white font-bold">Business</span>.
            </p>
          </div>
          <Link
            to="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white transition-colors"
            style={{ background: '#EA580C', boxShadow: '0 4px 20px rgba(234,88,12,0.3)' }}
          >
            Lihat Paket Pro →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {(!isDesktop && !hideMobileHeader) && <BrokerMobileHeader title="Pegawai" onMenuClick={() => setSidebarOpen(true)} />}
      <div style={{ padding: isDesktop ? '32px 40px' : '20px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ display: isDesktop ? 'block' : 'none', fontSize: isDesktop ? '28px' : '22px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans', marginBottom: '20px' }}>
          Pegawai & Payroll
        </h1>

        <div style={{ display: 'flex', gap: '4px', background: C.card, borderRadius: '12px', padding: '4px', marginBottom: '24px', border: `1px solid ${C.border}` }}>
          {[{ id: 'pegawai', label: 'Data Pegawai' }, { id: 'payroll', label: 'Gaji & Payroll' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? C.accent : 'transparent',
              color: tab === t.id ? '#fff' : C.muted,
              fontWeight: 800, fontSize: '12px',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'pegawai' ? <TabPegawai isDesktop={isDesktop} /> : <TabPayroll isDesktop={isDesktop} />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: DATA PEGAWAI
// ═══════════════════════════════════════════════════════════════════════════
function TabPegawai({ isDesktop }) {
  const { data: employees = [], isError, error, refetch } = useSembakoEmployees()
  const createEmp = useCreateSembakoEmployee()
  const updateEmp = useUpdateSembakoEmployee()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})

  const { tenant } = useAuth()
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['profiles', 'team', tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('tenant_id', tenant.id).order('created_at');
      if (error) throw error;
      return data || [];
    }
  });

  function openNew() {
    setForm({
      full_name: '', role: 'gudang', phone: '', address: '', join_date: new Date().toISOString().slice(0, 10),
      salary_type: 'bulanan', base_salary: 0, commission_pct: 0, trip_rate: 0, notes: '',
      profile_id: 'none', status: 'aktif', pay_day: 'Tanggal 1'
    })
    setEditing('new')
  }
  function openEdit(e) { setForm({ ...e, profile_id: e.profile_id || 'none', status: e.status || 'aktif', pay_day: e.pay_day || 'Tanggal 1' }); setEditing(e) }

  async function handleSave() {
    if (!form.full_name) return
    const payload = { ...form }
    if (payload.profile_id === 'none') payload.profile_id = null
    if (editing === 'new') await createEmp.mutateAsync(payload)
    else await updateEmp.mutateAsync({ id: editing.id, ...payload })
    setEditing(null)
  }

  if (isError) return <SembakoErrorState error={error} onRetry={refetch} />

  return (
    <div>
      <button onClick={openNew} style={{ ...sBtn(true), marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Plus size={14} /> Tambah Pegawai
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3,1fr)' : '1fr', gap: '12px' }}>
        {employees.map(emp => {
          const stColor = STATUS_COLOR[emp.status] || C.muted
          const salType = SALARY_TYPES.find(s => s.value === emp.salary_type)
          return (
            <motion.div key={emp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => openEdit(emp)} style={{
                background: C.card, borderRadius: '14px', padding: '14px',
                border: `1px solid ${C.border}`, cursor: 'pointer',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'rgba(234,88,12,0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: 800, color: C.accent,
                }}>
                  {(emp.full_name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(234,88,12,0.15)', color: C.accent }}>{emp.role}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: `${stColor}20`, color: stColor }}>
                      {emp.status}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {salType && (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: `${salType.color}18`, color: salType.color }}>
                    {salType.label}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: C.text, fontWeight: 700 }}>
                  {emp.base_salary > 0 ? formatIDR(emp.base_salary) : ''}
                  {emp.commission_pct > 0 ? ` +${emp.commission_pct}%` : ''}
                </span>
              </div>
            </motion.div>
          )
        })}
        {employees.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, gridColumn: '1/-1' }}>
            <Users size={32} color={C.muted} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '13px', fontWeight: 600 }}>Belum ada pegawai</p>
          </div>
        )}
      </div>

      {/* CRUD Sheet */}
      <Sheet open={editing !== null} onOpenChange={v => !v && setEditing(null)}>
        <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, maxWidth: '420px', width: '100%', padding: '24px', overflowY: 'auto' }}>
          <SheetHeader>
            <SheetTitle style={{ color: C.text, fontWeight: 900 }}>{editing === 'new' ? 'Tambah Pegawai' : 'Edit Pegawai'}</SheetTitle>
            <SheetDescription className="sr-only">Form untuk mengelola data pegawai sales & gudang rokok.</SheetDescription>
          </SheetHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingBottom: '100px' }}>
            <div><p style={sLabel}>NAMA LENGKAP *</p><input id="emp-name" name="full_name" style={sInput} value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            
            <div>
              <p style={sLabel}>LINK KE AKUN TIM</p>
              <CustomSelect
                id="emp-profile"
                value={form.profile_id || 'none'}
                onChange={val => setForm({ ...form, profile_id: val })}
                options={[
                  { value: 'none', label: '— Tidak terhubung —' },
                  ...teamMembers.map(m => ({ value: m.id, label: `${m.full_name} (${m.role})` }))
                ]}
                placeholder="— Tidak terhubung —"
              />
              <p style={{ fontSize: '10px', color: '#4B6478', marginTop: '6px' }}>
                Hubungkan pegawai ke akun tim agar bisa menerima tugas otomatis.
              </p>
            </div>

            <div><p style={sLabel}>ROLE</p>
              <CustomSelect
                id="emp-role"
                value={form.role || 'gudang'}
                onChange={val => setForm({ ...form, role: val })}
                options={ROLES.map(r => ({ value: r, label: r }))}
                placeholder="Pilih role"
              />
            </div>
            <div><p style={sLabel}>NO HP</p><PhoneInput id="emp-phone" name="phone" style={sInput} value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><p style={sLabel}>ALAMAT</p><input id="emp-addr" name="address" style={sInput} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><p style={sLabel}>TANGGAL MASUK</p><DatePicker id="emp-join" value={form.join_date || ''} onChange={val => setForm({ ...form, join_date: val })} placeholder="Pilih tanggal" /></div>
            <div><p style={sLabel}>TIPE GAJI</p>
              <CustomSelect
                value={form.salary_type || 'bulanan'}
                onChange={val => setForm({ ...form, salary_type: val })}
                options={SALARY_TYPES}
                placeholder="Pilih tipe"
              />
            </div>

            {/* Dynamic salary fields */}
            {(form.salary_type === 'harian' || form.salary_type === 'bulanan' || form.salary_type === 'campuran') && (
              <div><p style={sLabel}>GAJI POKOK {form.salary_type === 'harian' ? '(PER HARI)' : '(PER BULAN)'}</p><InputRupiah value={form.base_salary || 0} onChange={v => setForm({ ...form, base_salary: v })} /></div>
            )}
            {(form.salary_type === 'borongan' || form.salary_type === 'campuran') && (
              <div><p style={sLabel}>TARIF PER TRIP</p><InputRupiah value={form.trip_rate || 0} onChange={v => setForm({ ...form, trip_rate: v })} /></div>
            )}
            {(form.salary_type === 'komisi' || form.salary_type === 'campuran') && (
              <>
                <div><p style={sLabel}>KOMISI (%)</p><input type="number" min={0} max={100} step={0.1} style={sInput} value={form.commission_pct || ''} onChange={e => setForm({ ...form, commission_pct: parseFloat(e.target.value) || 0 })} /></div>
                {form.salary_type === 'komisi' && (
                  <div><p style={sLabel}>GAJI POKOK (OPSIONAL)</p><InputRupiah value={form.base_salary || 0} onChange={v => setForm({ ...form, base_salary: v })} /></div>
                )}
              </>
            )}

            <div><p style={sLabel}>TANGGAL GAJIAN</p>
              <CustomSelect
                value={form.pay_day || 'Tanggal 1'}
                onChange={val => setForm({ ...form, pay_day: val })}
                options={Array.from({ length: 28 }, (_, i) => ({ value: `Tanggal ${i + 1}`, label: `Tanggal ${i + 1}` }))}
                placeholder="Pilih tanggal"
              />
            </div>

            <div><p style={sLabel}>STATUS</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'aktif', label: '✅ Aktif' },
                  { value: 'nonaktif', label: '⛔ Nonaktif' },
                ].map(s => (
                  <button
                    key={s.value} type="button"
                    onClick={() => setForm({ ...form, status: s.value })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
                      border: form.status === s.value ? `1.5px solid ${s.value === 'aktif' ? '#021a02' : '#F87171'}` : `1.5px solid rgba(255,255,255,0.07)`,
                      background: form.status === s.value ? (s.value === 'aktif' ? 'rgba(2, 26, 2,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(255,255,255,0.04)',
                      color: form.status === s.value ? (s.value === 'aktif' ? '#021a02' : '#F87171') : '#4B6478',
                      transition: 'all 0.2s'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div><p style={sLabel}>CATATAN</p><textarea rows={2} style={{ ...sInput, resize: 'vertical' }} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <button onClick={handleSave} style={{ ...sBtn(true), width: '100%', padding: '14px' }}>
              {(createEmp.isPending || updateEmp.isPending) ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: GAJI & PAYROLL
// ═══════════════════════════════════════════════════════════════════════════
function TabPayroll({ isDesktop }) {
  const { data: employees = [], isError: isEmpError, error: empError, refetch: refetchEmp } = useSembakoEmployees()
  const { data: payrolls = [], isError: isPayError, error: payError, refetch: refetchPay } = useSembakoPayrolls()
  const recordPayroll = useRecordPayroll()
  const markPaid = useMarkPayrollPaid()

  const [filterMonth, setFilterMonth] = useState('')
  const [filterEmp, setFilterEmp] = useState('')

  // ── Payroll form state ──
  const [empId, setEmpId] = useState('')
  const [periodDate, setPeriodDate] = useState(new Date().toISOString().slice(0, 10))
  const [workDays, setWorkDays] = useState(0)
  const [tripCount, setTripCount] = useState(0)
  const [salesAmount, setSalesAmount] = useState(0)
  const [bonus, setBonus] = useState(0)
  const [deduction, setDeduction] = useState(0)
  const [payNotes, setPayNotes] = useState('')

  const selectedEmp = employees.find(e => e.id === empId)

  // Auto-calc when employee selected or inputs change
  const calcBase = useMemo(() => {
    if (!selectedEmp) return 0
    const st = selectedEmp.salary_type
    if (st === 'harian') return workDays * (selectedEmp.base_salary || 0)
    if (st === 'bulanan') return selectedEmp.base_salary || 0
    if (st === 'borongan') return tripCount * (selectedEmp.trip_rate || 0)
    if (st === 'komisi') return selectedEmp.base_salary || 0
    if (st === 'campuran') return (workDays > 0 ? workDays * (selectedEmp.base_salary || 0) : (selectedEmp.base_salary || 0)) + tripCount * (selectedEmp.trip_rate || 0)
    return 0
  }, [selectedEmp, workDays, tripCount]) // eslint-disable-line react-hooks/preserve-manual-memoization -- selectedEmp is a reference read inside memo, not mutated

  const calcComm = useMemo(() => { // eslint-disable-line react-hooks/preserve-manual-memoization -- selectedEmp read-only in memo; cascade from calcBase skip
    if (!selectedEmp || !selectedEmp.commission_pct) return 0
    return Math.round(salesAmount * selectedEmp.commission_pct / 100)
  }, [selectedEmp, salesAmount]) // eslint-disable-line react-hooks/preserve-manual-memoization

  const totalPay = calcBase + calcComm + bonus - deduction

  function handleSelectEmp(id) {
    setEmpId(id)
    setWorkDays(0); setTripCount(0); setSalesAmount(0); setBonus(0); setDeduction(0)
  }

  async function handleSubmit() {
    if (!empId) return
    const st = selectedEmp?.salary_type || 'bulanan'
    await recordPayroll.mutateAsync({
      employee_id: empId,
      period_type: st === 'campuran' ? 'bulanan' : st,
      period_date: periodDate,
      work_days: workDays || 0,
      trip_count: tripCount || 0,
      sales_amount: salesAmount || 0,
      base_amount: calcBase,
      commission_amount: calcComm,
      bonus, deduction, notes: payNotes,
    })
    setEmpId(''); setWorkDays(0); setTripCount(0); setSalesAmount(0); setBonus(0); setDeduction(0); setPayNotes('')
  }

  // Summary
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 86400000)
  const thisMonthPayrolls = payrolls.filter(p => new Date(p.period_date) > thirtyDaysAgo)
  const totalPaid = thisMonthPayrolls.filter(p => p.payment_status === 'paid').reduce((s, p) => s + (p.total_pay || 0), 0)
  const totalPending = thisMonthPayrolls.filter(p => p.payment_status === 'pending').reduce((s, p) => s + (p.total_pay || 0), 0)
  const paidCount = new Set(thisMonthPayrolls.filter(p => p.payment_status === 'paid').map(p => p.employee_id)).size

  // Filtered history
  const filteredPayrolls = useMemo(() => {
    let list = [...payrolls]
    if (filterEmp) list = list.filter(p => p.employee_id === filterEmp)
    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number)
      list = list.filter(p => {
        const d = new Date(p.period_date)
        return d.getFullYear() === y && d.getMonth() + 1 === m
      })
    }
    return list
  }, [payrolls, filterEmp, filterMonth]) // eslint-disable-line react-hooks/preserve-manual-memoization -- payrolls spread prevents mutation; list is locally constructed

  if (isEmpError) return <SembakoErrorState error={empError} onRetry={refetchEmp} />
  if (isPayError) return <SembakoErrorState error={payError} onRetry={refetchPay} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION A: Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3,1fr)' : '1fr', gap: '12px' }}>
        <SummaryCard icon={DollarSign} label="Gaji Terbayar" value={formatIDR(totalPaid)} color={C.green} />
        <SummaryCard icon={CalendarCheck} label="Gaji Pending" value={formatIDR(totalPending)} color={C.amber} />
        <SummaryCard icon={Users} label="Pegawai Digaji" value={paidCount} color={C.accent} />
      </div>

      {/* SECTION B: Input Gaji */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}` }}>
        <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '16px' }}>CATAT GAJI</p>

        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '12px' }}>
          <div>
            <p style={sLabel}>PEGAWAI</p>
            <CustomSelect
              value={empId}
              onChange={handleSelectEmp}
              options={[
                { value: '', label: '— Pilih pegawai —' },
                ...employees.filter(e => e.status === 'aktif').map(e => ({ value: e.id, label: `${e.full_name} (${e.salary_type})` }))
              ]}
              placeholder="— Pilih pegawai —"
            />
          </div>
          <div>
            <p style={sLabel}>PERIODE</p>
            <DatePicker value={periodDate} onChange={val => setPeriodDate(val)} placeholder="Pilih tanggal" />
          </div>
        </div>

        {selectedEmp && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Dynamic fields per salary_type */}
            {(selectedEmp.salary_type === 'harian' || selectedEmp.salary_type === 'campuran') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={sLabel}>HARI KERJA</p>
                  <input type="number" min={0} style={sInput} value={workDays || ''} onChange={e => setWorkDays(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <p style={{ ...sLabel, opacity: 0.6 }}>AUTO-CALC</p>
                  <div style={{ ...sInput, opacity: 0.6 }}>{workDays} × {formatIDR(selectedEmp.base_salary || 0)} = {formatIDR(workDays * (selectedEmp.base_salary || 0))}</div>
                </div>
              </div>
            )}

            {selectedEmp.salary_type === 'bulanan' && (
              <div>
                <p style={sLabel}>GAJI POKOK (AUTO)</p>
                <div style={{ ...sInput, opacity: 0.6 }}>{formatIDR(selectedEmp.base_salary || 0)}</div>
              </div>
            )}

            {(selectedEmp.salary_type === 'borongan' || selectedEmp.salary_type === 'campuran') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={sLabel}>JUMLAH TRIP</p>
                  <input type="number" min={0} style={sInput} value={tripCount || ''} onChange={e => setTripCount(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <p style={{ ...sLabel, opacity: 0.6 }}>AUTO-CALC</p>
                  <div style={{ ...sInput, opacity: 0.6 }}>{tripCount} × {formatIDR(selectedEmp.trip_rate || 0)} = {formatIDR(tripCount * (selectedEmp.trip_rate || 0))}</div>
                </div>
              </div>
            )}

            {(selectedEmp.salary_type === 'komisi' || selectedEmp.salary_type === 'campuran') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={sLabel}>TOTAL PENJUALAN</p>
                  <InputRupiah value={salesAmount} onChange={setSalesAmount} />
                </div>
                <div>
                  <p style={{ ...sLabel, opacity: 0.6 }}>KOMISI ({selectedEmp.commission_pct}%)</p>
                  <div style={{ ...sInput, opacity: 0.6 }}>{formatIDR(calcComm)}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><p style={sLabel}>BONUS</p><InputRupiah value={bonus} onChange={setBonus} /></div>
              <div><p style={sLabel}>POTONGAN</p><InputRupiah value={deduction} onChange={setDeduction} /></div>
            </div>

            {/* Preview */}
            <div style={{ background: C.input, borderRadius: '12px', padding: '14px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: C.muted }}>Base</span>
                <span style={{ fontSize: '12px', color: C.text, fontWeight: 600 }}>{formatIDR(calcBase)}</span>
              </div>
              {calcComm > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: C.muted }}>Komisi</span>
                <span style={{ fontSize: '12px', color: C.text, fontWeight: 600 }}>+ {formatIDR(calcComm)}</span>
              </div>}
              {bonus > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: C.muted }}>Bonus</span>
                <span style={{ fontSize: '12px', color: C.green, fontWeight: 600 }}>+ {formatIDR(bonus)}</span>
              </div>}
              {deduction > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: C.muted }}>Potongan</span>
                <span style={{ fontSize: '12px', color: C.red, fontWeight: 600 }}>- {formatIDR(deduction)}</span>
              </div>}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: C.text, fontWeight: 800 }}>TOTAL</span>
                <span style={{ fontSize: '16px', color: C.text, fontWeight: 900, fontFamily: 'DM Sans' }}>{formatIDR(totalPay)}</span>
              </div>
            </div>

            <div><p style={sLabel}>CATATAN</p><textarea rows={2} style={{ ...sInput, resize: 'vertical' }} value={payNotes} onChange={e => setPayNotes(e.target.value)} /></div>

            <button onClick={handleSubmit} disabled={recordPayroll.isPending} style={{ ...sBtn(true), width: '100%', padding: '14px' }}>
              {recordPayroll.isPending ? 'Menyimpan...' : 'Catat Gaji'}
            </button>
          </div>
        )}
      </div>

      {/* SECTION C: History */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '12px' }}>RIWAYAT PAYROLL</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input type="month" style={{ ...sInput, width: 'auto', minWidth: '160px' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
          <CustomSelect
            style={{ width: 'auto', minWidth: '160px' }}
            value={filterEmp}
            onChange={setFilterEmp}
            options={[
              { value: '', label: 'Semua Pegawai' },
              ...employees.map(e => ({ value: e.id, label: e.full_name }))
            ]}
            placeholder="Semua Pegawai"
          />
        </div>

        {/* Desktop Table */}
        {isDesktop ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Pegawai', 'Periode', 'Tipe', 'Hari/Trip', 'Base', 'Komisi', 'Bonus', 'Potongan', 'Total', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '8px 6px', color: C.muted, fontWeight: 700, fontSize: '10px', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map(p => {
                  const isPending = p.payment_status === 'pending'
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid rgba(234,88,12,0.08)` }}>
                      <td style={{ padding: '8px 6px', color: C.text, fontWeight: 600 }}>{p.sembako_employees?.full_name || '-'}</td>
                      <td style={{ padding: '8px 6px', color: C.muted }}>{fmtDate(p.period_date)}</td>
                      <td style={{ padding: '8px 6px', color: C.muted }}>{p.period_type}</td>
                      <td style={{ padding: '8px 6px', color: C.text }}>{p.work_days || p.trip_count || '-'}</td>
                      <td style={{ padding: '8px 6px', color: C.text }}>{formatIDR(p.base_amount)}</td>
                      <td style={{ padding: '8px 6px', color: C.text }}>{p.commission_amount ? formatIDR(p.commission_amount) : '-'}</td>
                      <td style={{ padding: '8px 6px', color: C.green }}>{p.bonus ? `+${formatIDR(p.bonus)}` : '-'}</td>
                      <td style={{ padding: '8px 6px', color: C.red }}>{p.deduction ? `-${formatIDR(p.deduction)}` : '-'}</td>
                      <td style={{ padding: '8px 6px', color: C.text, fontWeight: 700 }}>{formatIDR(p.total_pay)}</td>
                      <td style={{ padding: '8px 6px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                          background: isPending ? 'rgba(245,158,11,0.12)' : 'rgba(2, 26, 2,0.12)',
                          color: isPending ? C.amber : C.green,
                        }}>{isPending ? 'Pending' : 'Paid'}</span>
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        {isPending && (
                          <button onClick={() => markPaid.mutate(p.id)} style={{
                            background: 'rgba(2, 26, 2,0.15)', border: 'none', borderRadius: '6px',
                            padding: '4px 10px', cursor: 'pointer', color: C.green, fontSize: '10px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            <Check size={10} /> Lunas
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Mobile cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredPayrolls.map(p => {
              const isPending = p.payment_status === 'pending'
              return (
                <div key={p.id} style={{ background: C.card, borderRadius: '12px', padding: '12px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: C.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.sembako_employees?.full_name || '-'}</span>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                      background: isPending ? 'rgba(245,158,11,0.12)' : 'rgba(2, 26, 2,0.12)',
                      color: isPending ? C.amber : C.green,
                    }}>{isPending ? 'Pending' : 'Paid'}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: C.muted }}>{fmtDate(p.period_date)} · {p.period_type}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: C.text, fontFamily: 'DM Sans' }}>{formatIDR(p.total_pay)}</span>
                    {isPending && (
                      <button onClick={() => markPaid.mutate(p.id)} style={{
                        background: 'rgba(2, 26, 2,0.15)', border: 'none', borderRadius: '8px',
                        padding: '6px 12px', cursor: 'pointer', color: C.green, fontSize: '11px', fontWeight: 700,
                      }}>Tandai Lunas</button>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredPayrolls.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
                <DollarSign size={28} color={C.muted} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 600 }}>Belum ada data payroll</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared ───────────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
      background: C.card, borderRadius: '14px', padding: '14px',
      border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
        <Icon size={14} color={color} />
      </div>
      <p style={{ fontSize: '10px', color: C.muted, fontWeight: 700, letterSpacing: '0.06em' }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: '18px', fontWeight: 800, color: C.text, fontFamily: 'DM Sans' }}>{value}</p>
    </motion.div>
  )
}
