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

const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'broker@dashboard.id',
  app_metadata: { is_superadmin: false }
}

const MOCK_PROFILE = {
  id: '00000000-0000-0000-0000-000000000003',
  auth_user_id: '00000000-0000-0000-0000-000000000001',
  tenant_id: '00000000-0000-0000-0000-000000000002',
  full_name: 'Broker Sembako',
  role: 'owner',
  app_role: 'user',
  user_type: 'broker',
  business_model_selected: 'sembako_broker',
  onboarded: true,
  is_onboarded: true,
  tenants: {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Broker Dashboard Sembako',
    sub_type: 'sembako_broker',
    business_vertical: 'distributor_sembako'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK_USER)
  const [profile, setProfile] = useState(MOCK_PROFILE)
  const [profiles, setProfiles] = useState([MOCK_PROFILE])
  const [ownerTenant, setOwnerTenant] = useState(MOCK_PROFILE.tenants)
  const [loading, setLoading] = useState(false)

  const getPersistedTenantId = () => localStorage.getItem('ternakos_active_tenant_id')
  const setPersistedTenantId = (id) => localStorage.setItem('ternakos_active_tenant_id', id)

  async function fetchAuthData(userId) {
    setLoggerContext({ userId, tenantId: null, vertical: null, role: null })

    const { data: legacyProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
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
      console.error('Error fetching memberships:', memberError)
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
      combined = [MOCK_PROFILE]
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

    if (!active) active = MOCK_PROFILE

    const ownedMembership = combined.find(m => m.role === 'owner')
    setOwnerTenant(ownedMembership?.tenants || MOCK_PROFILE.tenants)

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchAuthData(session.user.id)
      } else {
        setUser(MOCK_USER)
        setProfile(MOCK_PROFILE)
        setProfiles([MOCK_PROFILE])
        setOwnerTenant(MOCK_PROFILE.tenants)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          fetchAuthData(session.user.id)
        } else {
          setUser(MOCK_USER)
          setProfile(MOCK_PROFILE)
          setProfiles([MOCK_PROFILE])
          setOwnerTenant(MOCK_PROFILE.tenants)
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

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

  const value = {
    user,
    profile,
    profiles,
    tenant: profile?.tenants,         // Active working tenant (for data fetching & routing)
    ownerTenant,                        // User's OWN tenant (for subscription & plan gating)
    isSuperadmin,
    loading,
    switchTenant,
    refetchProfile: () => user && fetchAuthData(user.id),
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
