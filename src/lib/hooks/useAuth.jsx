import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { getXBasePath } from '../businessModel'
import { setLoggerContext, logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

// ── Auth Context ───────────────────────────────────────────────────────────────
// Single source of truth untuk auth state.
// getSession() hanya dipanggil SEKALI di AuthProvider, bukan per-komponen.
// Semua pemanggil useAuth() membaca dari context yang sama → tidak ada race condition.

const AuthContext = createContext(null)

// Throttling helper for last_seen_at updates (15 minutes per tenant ID)
const throttleLastSeenUpdate = async (userId, tenantId) => {
  if (!userId || !tenantId) return
  const THROTTLE_MS = 15 * 60 * 1000 // 15 minutes
  const key = `ternakos_last_seen_${tenantId}`
  
  try {
    const lastUpdateStr = sessionStorage.getItem(key)
    const now = Date.now()
    if (lastUpdateStr) {
      const lastUpdate = parseInt(lastUpdateStr, 10)
      if (now - lastUpdate < THROTTLE_MS) {
        return
      }
    }
    
    sessionStorage.setItem(key, now.toString())
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .eq('auth_user_id', userId)
      .eq('tenant_id', tenantId)

    if (error) {
      logError({
        level: 'error',
        source: 'supabase',
        component: 'AuthProvider',
        actionName: 'throttleLastSeenUpdate',
        error,
        metadata: {
          table: 'profiles',
          operation: 'update',
          target_tenant_id: tenantId,
        },
      })
    }
  } catch (err) {
    console.error('[useAuth] Error in throttleLastSeenUpdate:', err)
  }
}

const getFallbackExpiryDate = (days = 30) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export const REGISTERED_ROLES = {
  dev: {
    user: { id: '00000000-0000-0000-0000-000000000001', email: 'dev@sembako.id' },
    profile: {
      id: 'prof-dev-001',
      auth_user_id: '00000000-0000-0000-0000-000000000001',
      tenant_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Dev Superadmin',
      role: 'dev',
      app_role: 'dev',
      user_type: 'broker',
      sub_type: 'distributor_sembako',
      business_name: 'Broker Dashboard Sembako',
      onboarded: true,
      is_onboarded: true,
      tenants: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Broker Dashboard Sembako',
        business_name: 'Broker Dashboard Sembako',
        sub_type: 'sembako_broker',
        business_vertical: 'distributor_sembako',
        plan: 'pro',
        license_activated_at: new Date().toISOString(),
        plan_expires_at: getFallbackExpiryDate(30)
      }
    }
  },
  owner: {
    user: { id: '00000000-0000-0000-0000-000000000002', email: 'owner@sembako.id' },
    profile: {
      id: 'prof-owner-001',
      auth_user_id: '00000000-0000-0000-0000-000000000002',
      tenant_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Pemilik Toko',
      role: 'owner',
      app_role: 'owner',
      user_type: 'broker',
      sub_type: 'distributor_sembako',
      business_name: 'Broker Dashboard Sembako',
      onboarded: true,
      is_onboarded: true,
      tenants: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Broker Dashboard Sembako',
        business_name: 'Broker Dashboard Sembako',
        sub_type: 'sembako_broker',
        business_vertical: 'distributor_sembako',
        plan: 'pro',
        license_activated_at: new Date().toISOString(),
        plan_expires_at: getFallbackExpiryDate(30)
      }
    }
  },
  admin: {
    user: { id: '00000000-0000-0000-0000-000000000003', email: 'admin@sembako.id' },
    profile: {
      id: 'prof-admin-001',
      auth_user_id: '00000000-0000-0000-0000-000000000003',
      tenant_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Kasir / Admin',
      role: 'admin',
      app_role: 'admin',
      user_type: 'broker',
      sub_type: 'distributor_sembako',
      business_name: 'Broker Dashboard Sembako',
      onboarded: true,
      is_onboarded: true,
      tenants: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Broker Dashboard Sembako',
        business_name: 'Broker Dashboard Sembako',
        sub_type: 'sembako_broker',
        business_vertical: 'distributor_sembako',
        plan: 'pro',
        license_activated_at: new Date().toISOString(),
        plan_expires_at: getFallbackExpiryDate(30)
      }
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [ownerTenant, setOwnerTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  const getPersistedTenantId = () => localStorage.getItem('ternakos_active_tenant_id')
  const setPersistedTenantId = (id) => localStorage.setItem('ternakos_active_tenant_id', id)

  async function fetchAuthData(userId) {
    setLoading(true)
    setLoggerContext({ userId, tenantId: null, vertical: null, role: null })

    const { data: legacyProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)

    if (profilesError) {
      logSupabaseError(profilesError, {
        table: 'profiles',
        operation: 'select',
        component: 'AuthProvider',
        actionName: 'auth.fetch_profiles',
      })
    }

    const { data: memberData, error: memberError } = await supabase
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)

    if (memberError) {
      logSupabaseError(memberError, {
        table: 'tenant_memberships',
        operation: 'select',
        component: 'AuthProvider',
        actionName: 'auth.fetch_memberships',
      })
    }

    const lpSafe = legacyProfiles || []
    const mdSafe = memberData || []
    const masterProfile = lpSafe.find(p => p.full_name) || lpSafe[0] || mdSafe[0] || {}
    
    let combined = mdSafe.map(m => {
      const legacyMatch = lpSafe.find(lp => lp.tenant_id === m.tenant_id)
      return {
        ...m,
        profile_id: legacyMatch?.id ?? null,
        app_role: legacyMatch?.app_role ?? m.app_role ?? masterProfile.app_role,
        role: legacyMatch?.role ?? m.role ?? masterProfile.role,
        full_name: m.full_name || masterProfile.full_name,
        avatar_url: m.avatar_url || masterProfile.avatar_url,
        onboarded: m.onboarded ?? masterProfile.onboarded,
        business_model_selected: m.business_model_selected ?? masterProfile.business_model_selected,
        is_onboarded: m.is_onboarded ?? masterProfile.is_onboarded,
        last_seen_at: m.last_seen_at || masterProfile.last_seen_at
      }
    })

    lpSafe.forEach(lp => {
      if (!combined.some(c => c.tenant_id === lp.tenant_id)) {
        combined.push(lp)
      }
    })

    if (combined.length === 0) {
      setProfiles([])
      setProfile(null)
      setUser(null)
      setLoading(false)
      return
    }

    setProfiles(combined)

    const savedTenantId = getPersistedTenantId()
    let active = null

    if (savedTenantId) {
      active = combined.find(p => p.tenant_id === savedTenantId)
    }

    if (!active && combined.length > 0) {
      active = combined.find(c => c.onboarded && c.role === 'owner')
        || combined.find(c => c.onboarded)
        || combined[0]
      if (active.tenant_id) setPersistedTenantId(active.tenant_id)
    }

    const ownedMembership = combined.find(m => m.role === 'owner')
    setOwnerTenant(ownedMembership?.tenants || active?.tenants)

    setProfile(active)
    setLoading(false)

    setLoggerContext({
      userId: active?.auth_user_id || userId,
      tenantId: active?.tenant_id || null,
      role: active?.app_role || active?.role || active?.user_type || null,
      vertical: null,
    })

    if (active?.tenant_id) {
      throttleLastSeenUpdate(userId, active.tenant_id)
    }
  }

  const loadLocalRoleSession = async () => {
    const savedRole = localStorage.getItem('sembako_active_role')
    if (savedRole && REGISTERED_ROLES[savedRole]) {
      const config = REGISTERED_ROLES[savedRole]
      const savedTenantId = getPersistedTenantId() || config.profile.tenant_id

      let liveTenant = config.profile.tenants
      if (savedTenantId) {
        try {
          const { data: dbTenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', savedTenantId)
            .maybeSingle()

          if (dbTenant) {
            liveTenant = dbTenant
          } else {
            const { data: firstTenant } = await supabase
              .from('tenants')
              .select('*')
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle()

            if (firstTenant) {
              liveTenant = firstTenant
            }
          }
        } catch { /* use default fallback */ }
      }

      const updatedProfile = {
        ...config.profile,
        tenant_id: liveTenant?.id || config.profile.tenant_id,
        tenants: liveTenant
      }

      setUser(config.user)
      setProfile(updatedProfile)
      setProfiles([updatedProfile])
      setOwnerTenant(liveTenant)
      setLoading(false)
      return true
    }
    return false
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchAuthData(session.user.id)
      } else {
        loadLocalRoleSession().then(loadedLocal => {
          if (!loadedLocal) {
            setUser(null)
            setProfile(null)
            setProfiles([])
            setOwnerTenant(null)
            setLoading(false)
          }
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          fetchAuthData(session.user.id)
        } else {
          loadLocalRoleSession().then(loadedLocal => {
            if (!loadedLocal) {
              setUser(null)
              setProfile(null)
              setProfiles([])
              setOwnerTenant(null)
              setLoading(false)
            }
          })
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // Realtime subscription untuk mendengarkan perubahan lisensi di tabel tenants secara live
  useEffect(() => {
    const activeTenantId = profile?.tenants?.id || ownerTenant?.id
    if (!activeTenantId) return

    const channel = supabase
      .channel(`public:tenants:${activeTenantId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tenants', filter: `id=eq.${activeTenantId}` },
        (payload) => {
          if (payload.new) {
            setProfile(prev => prev ? { ...prev, tenants: payload.new } : prev)
            setOwnerTenant(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.tenants?.id, ownerTenant?.id])

  const switchTenant = async (tenantId) => {
    const target = profiles.find(p => p.tenant_id === tenantId)
    if (target && user) {
      // 1. Update database active session (only safe fields like last_seen_at) - THROTTLED
      await throttleLastSeenUpdate(user.id, target.tenant_id)

      // 2. Update local state
      setProfile(target)
      setPersistedTenantId(target.tenant_id)
      return true
    }
    return false
  }

  // Dual-mode check: JWT app_metadata (Supabase Auth) OR profile.app_role/role column (DB)
  // app_metadata.is_superadmin requires a Supabase custom claim to be set.
  // profile.app_role / profile.role are set directly in the DB and available immediately.
  // Safety net: scan ALL profiles in case active profile is from tenant_memberships without app_role
  const isSuperadmin =
    user?.app_metadata?.is_superadmin === true ||
    profile?.app_role === 'superadmin' ||
    profile?.role === 'superadmin' ||
    profiles.some(p => p.app_role === 'superadmin' || p.role === 'superadmin')

  const loginAsRole = async (roleKey) => {
    if (REGISTERED_ROLES[roleKey]) {
      localStorage.setItem('sembako_active_role', roleKey)
      await loadLocalRoleSession()
      return true
    }
    return false
  }

  const logout = async () => {
    localStorage.removeItem('sembako_active_role')
    localStorage.removeItem('ternakos_active_tenant_id')
    try { await supabase.auth.signOut() } catch { /* ok */ }
    setUser(null)
    setProfile(null)
    setProfiles([])
    setOwnerTenant(null)
    setLoading(false)
  }

  const refetchProfile = async () => {
    const savedRole = localStorage.getItem('sembako_active_role')
    if (savedRole) {
      await loadLocalRoleSession()
    } else if (user) {
      await fetchAuthData(user.id)
    }
  }

  const value = {
    user,
    profile,
    profiles,
    tenant: profile?.tenants,         // Active working tenant (for data fetching & routing)
    ownerTenant,                        // User's OWN tenant (for subscription & plan gating)
    isSuperadmin,
    loading,
    switchTenant,
    loginAsRole,
    logout,
    refetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    // Graceful fallback during HMR or if called outside AuthProvider
    // NotificationsProvider and other consumers guard against null tenant/profile
    if (import.meta.env.DEV) {
      console.warn('[useAuth] Called outside <AuthProvider> — returning empty context.')
    }
    return {
      user: null, profile: null, tenant: null, tenants: [],
      loading: true, switchTenant: async () => { }, refetchProfile: () => { },
    }
  }
  return ctx
}

export const getBrokerBasePath = (tenant, profile) => {
  return getXBasePath(tenant, profile)
}

export const getPeternakBasePath = (tenant, profile) => {
  return getXBasePath(tenant, profile)
}
