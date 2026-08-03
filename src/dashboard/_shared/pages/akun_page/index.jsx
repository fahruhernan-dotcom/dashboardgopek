import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical, getXBasePath } from '@/lib/businessModel'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { logError } from '@/lib/logger/errorLogger'
import { useLanguage } from '@/lib/i18n/useLanguage'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'

import {
  T,
  VERTICAL_ACCENTS,
  ROLE_LABELS,
  PERMISSION_MATRIX,
  BILLING_ROLES,
  PLAN_INFO,
  getUserRole,
  normalizeVertical
} from './constants'

import {
  ProfileHero,
  QuickActions,
  ActiveBusinessCard,
  AccessSummaryCard,
  BillingCard,
  BillingHandledByOwnerCard,
  VerticalShortcutsCard,
  PreferencesCard,
  HelpAboutCard,
  LogoutBtn,
  getEditBizPath
} from './components/AccountCards'

import {
  EditProfileSheet,
  EditBisnisSheet,
  DeleteBusinessDialog,
  DangerZoneSheet
} from './components/DialogSheets'

export default function AkunPage() {
  const { user, profile, tenant, ownerTenant, profiles, isSuperadmin, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const { state: routerState } = useLocation()
  const { t, tRole, tVertical } = useLanguage()

  const activeTenant = tenant
  const billingTenant = ownerTenant || tenant

  const rawVertical = resolveBusinessVertical(profile, activeTenant)
  const verticalKey = normalizeVertical(rawVertical)
  const basePath = getXBasePath(activeTenant, profile) || ''
  const editBizPath = getEditBizPath(rawVertical, basePath)
  
  const originalAccent = VERTICAL_ACCENTS[verticalKey] || VERTICAL_ACCENTS.peternak
  const accent = {
    ...originalAccent,
    name: tVertical(verticalKey)
  }

  const role = isSuperadmin ? 'superadmin' : getUserRole(profile)
  const originalRoleBadge = ROLE_LABELS[role] || ROLE_LABELS.view_only
  const roleBadge = {
    ...originalRoleBadge,
    label: tRole(role)
  }
  const showBilling = BILLING_ROLES.includes(role)

  // Plan gating — use active tenant (staff on a Pro tenant get Pro features)
  const _sub = getSubscriptionStatus(activeTenant)
  const _isPro = isSuperadmin || ['pro', 'business'].includes(_sub.plan) || _sub.status === 'trial'
  const isStarter = !_isPro

  const isMultiTenant = (profiles?.length ?? 0) > 1
  const planKey = billingTenant?.plan || 'none'
  const plan = PLAN_INFO[planKey] ? planKey : 'none'

  const displayName = profile?.full_name || user?.email?.split('@')[0] || t('index_fallback_user', 'Pengguna')
  const email = user?.email || t('index_fallback_email', 'Belum tersedia')
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const tenantName = activeTenant?.business_name || activeTenant?.name || t('index_fallback_biz', 'Bisnis Aktif')
  const tenantCity = activeTenant?.city || activeTenant?.location || '—'

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'AkunPreview',
        actionName: 'handleLogout',
        error,
        metadata: { operation: 'signOut' },
      })
      toast.error(t('index_toast_logout_failed', 'Gagal keluar'))
    } else {
      navigate('/login')
    }
  }

  const canDeleteBusiness = role === 'owner' && !!activeTenant?.id
  const canEditBisnis = role === 'owner' && !!activeTenant?.id

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editBisnisOpen, setEditBisnisOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false)

  useEffect(() => {
    if (routerState?.openEditBisnis && canEditBisnis) {
      setEditBisnisOpen(true)
      navigate('.', { replace: true, state: {} })
    }
  }, [routerState?.openEditBisnis, canEditBisnis])

  const handleSwitchBiz = () => {
    if (!isMultiTenant) return
    toast.info(t('index_toast_switch_biz_info'))
  }

  const handleUpgrade = () => navigate('/upgrade')

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120 }}>
      <style>{`
        @keyframes pulse2 {
          0%, 100% { opacity: 1 }
          50%       { opacity: 0.4 }
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      {/* 1. Profile Hero */}
      <ProfileHero
        accent={accent} roleBadge={roleBadge}
        displayName={displayName} email={email} initials={initials}
        tenantName={tenantName}
      />

      <div style={{ padding: '0 20px' }}>

        {/* 2. Quick Actions */}
        <QuickActions
          accent={accent} plan={plan} showBilling={showBilling}
          isMultiTenant={isMultiTenant}
          onSwitch={handleSwitchBiz}
          onUpgrade={handleUpgrade}
          onManage={() => navigate('/billing')}
          onHelp={() => navigate('/hubungi-kami')}
          onEditProfile={() => setEditProfileOpen(true)}
        />

        {/* 3. Bisnis Aktif */}
        <ActiveBusinessCard
          accent={accent} roleBadge={roleBadge}
          tenantName={tenantName} tenantCity={tenantCity}
          tenantProvince={activeTenant?.province || null}
          canEditBisnis={canEditBisnis}
          onEditBiz={canEditBisnis ? () => setEditBisnisOpen(true) : (editBizPath ? () => navigate(editBizPath) : null)}
        />

        {/* 4. Akses Saya */}
        <AccessSummaryCard role={role} accent={accent} rawVertical={rawVertical} />

        {/* 5. Paket & Billing */}
        {showBilling
          ? <BillingCard accent={accent} plan={plan} onUpgrade={handleUpgrade} />
          : <BillingHandledByOwnerCard />
        }

        {/* 5.5. Pintasan Vertikal */}
        {basePath && (
          <VerticalShortcutsCard
            rawVertical={rawVertical} basePath={basePath}
            accent={accent} navigate={navigate}
            isStarter={isStarter}
          />
        )}

        {/* 6. Preferensi */}
        <PreferencesCard />

        {/* 7. Bantuan & Tentang */}
        <HelpAboutCard navigate={navigate} canDeleteBusiness={canDeleteBusiness} onDeleteClick={() => setDangerZoneOpen(true)} />

        {/* 9. Logout */}
        <LogoutBtn onLogout={handleLogout} />
      </div>

      {/* Edit Profile Sheet */}
      <EditProfileSheet
        key={editProfileOpen ? 'profile-open' : 'profile-closed'}
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        profile={profile}
        user={user}
        onSuccess={refetchProfile}
        accent={accent}
      />

      {/* Edit Bisnis Sheet */}
      <EditBisnisSheet
        key={editBisnisOpen ? 'bisnis-open' : 'bisnis-closed'}
        open={editBisnisOpen}
        onClose={() => setEditBisnisOpen(false)}
        tenant={activeTenant}
        onSuccess={refetchProfile}
        accent={accent}
      />

      {/* Delete Business Dialog */}
      {deleteDialogOpen && (
        <DeleteBusinessDialog
          tenant={activeTenant}
          profiles={profiles}
          onClose={() => setDeleteDialogOpen(false)}
          onDeleted={() => {
            setDeleteDialogOpen(false)
            // Clear persisted tenant so useAuth picks next available on refetch
            try { localStorage.removeItem('ternakos_active_tenant_id') } catch { /* ok */ }
            refetchProfile()
            // Give refetchProfile a tick to resolve then navigate
            setTimeout(() => {
              const remaining = profiles.filter(p => p.tenant_id !== activeTenant?.id)
              if (remaining.length > 0) {
                navigate('/', { replace: true })
              } else {
                navigate('/welcome', { replace: true })
              }
            }, 300)
          }}
        />
      )}

      {/* Danger Zone Sheet */}
      <DangerZoneSheet
        open={dangerZoneOpen}
        onClose={() => setDangerZoneOpen(false)}
        tenantName={tenantName}
        onDelete={() => setDeleteDialogOpen(true)}
      />
    </div>
  )
}
