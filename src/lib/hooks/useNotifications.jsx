import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { logSupabaseError } from '../logger/supabaseLogger'
import { useAuth } from './useAuth'
import { logError } from '../logger/errorLogger'
import { getXBasePath, resolveBusinessVertical } from '../businessModel'
import { getSubscriptionStatus } from '../subscriptionUtils'

const toTitleCase = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''

const NotificationsContext = createContext()

/**
 * Helper to calculate days until payday
 */
const calculateDaysUntilPayday = (salaryType, payDay) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (salaryType === 'mingguan') {
    const jsDay = payDay === 7 ? 0 : payDay
    const currentDay = today.getDay()
    let diff = jsDay - currentDay
    if (diff < 0) diff += 7
    return diff
  }

  // bulanan
  const pd = payDay || 1
  let next = new Date(today.getFullYear(), today.getMonth(), pd)
  if (next < today) {
    next = new Date(today.getFullYear(), today.getMonth() + 1, pd)
  }
  return Math.ceil((next - today) / (1000 * 60 * 60 * 24))
}

/**
 * Hook to manage notification state and visibility
 */
export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { tenant } = useAuth()

  const fetchNotifications = async () => {
    if (!tenant?.id) return
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error) setNotifications((data || []).filter(n => !n.is_deleted))
    setLoading(false)
  }

  useEffect(() => {
    if (!tenant?.id) {
      setLoading(false)
      return
    }

    fetchNotifications()
    
    // Realtime subscription
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `tenant_id=eq.${tenant.id}` 
      }, fetchNotifications)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) {
      logSupabaseError(error, { table: 'notifications', operation: 'update', component: 'useNotifications', actionName: 'notification.mark_read', tenantId: tenant?.id })
    }
    fetchNotifications()
  }

  const markAllAsRead = async () => {
    if (!tenant?.id) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('tenant_id', tenant.id)
      .eq('is_read', false)
    if (error) {
      logSupabaseError(error, { table: 'notifications', operation: 'update', component: 'useNotifications', actionName: 'notification.mark_read', tenantId: tenant?.id })
    }
    fetchNotifications()
  }

  const deleteNotif = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_deleted: true })
      .eq('id', id)
    if (error) {
      logSupabaseError(error, { table: 'notifications', operation: 'update', component: 'useNotifications', actionName: 'notification.delete', tenantId: tenant?.id })
    }
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationsContext.Provider value={{ notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotif, refetch: fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext) ?? {
  notifications: [], loading: false, unreadCount: 0,
  markAsRead: async () => {}, markAllAsRead: async () => {}, deleteNotif: async () => {}, refetch: () => {},
}

/**
 * Generator Hook: Periodically checks for new business-level alerts
 */
export const useNotificationGenerator = () => {
  const { tenant, profile } = useAuth()
  const context = useNotifications()
  const notificationsRef = useRef([])
  notificationsRef.current = context?.notifications || [] // eslint-disable-line react-hooks/refs -- intentional latest-value ref pattern; read only in event handlers, not in JSX

  const vertical = resolveBusinessVertical(profile, tenant)
  const basePath = getXBasePath(tenant, profile)

  const checkAndGenerate = async () => {
    if (!tenant?.id) return
    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      // Use ref to always read latest notifications without stale closure
      const existingKeys = new Set(
        notificationsRef.current.map((n) => n.type + (n.metadata?.ref_id ?? ''))
      )

      // 1. Piutang jatuh tempo
      if (vertical === 'poultry_broker') {
        const { data: overdueSales } = await supabase
          .from('sales')
          .select('id, rpa_clients(rpa_name), remaining_amount, due_date')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .neq('payment_status', 'lunas')
          .lt('due_date', today.toISOString())

        for (const sale of overdueSales || []) {
          if (existingKeys.has('piutang_jatuh_tempo' + sale.id)) continue
          const { error: e1 } = await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            type: 'piutang_jatuh_tempo',
            title: 'Piutang Jatuh Tempo',
            body: `${sale.rpa_clients?.rpa_name ?? 'RPA'} belum bayar dan sudah melewati due date.`,
            action_url: `${basePath}/rpa`,
            priority: 1,
            metadata: { ref_id: sale.id },
          })
          if (e1) logSupabaseError(e1, { table: 'notifications', operation: 'insert', component: 'useNotificationGenerator', actionName: 'notification.generate.piutang_broker' })
        }
      }

      if (vertical === 'distributor_sembako') {
        const { data: overdueSales } = await supabase
          .from('sembako_sales')
          .select('id, sembako_customers(customer_name), remaining_amount, due_date')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .neq('payment_status', 'lunas')
          .lt('due_date', today.toISOString())

        for (const sale of overdueSales || []) {
          if (existingKeys.has('piutang_jatuh_tempo' + sale.id)) continue
          const { error: e2 } = await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            type: 'piutang_jatuh_tempo',
            title: 'Piutang Jatuh Tempo',
            body: `${sale.sembako_customers?.customer_name ?? 'Customer'} belum bayar dan sudah melewati due date.`,
            action_url: `${basePath}/penjualan`,
            priority: 1,
            metadata: { ref_id: sale.id },
          })
          if (e2) logSupabaseError(e2, { table: 'notifications', operation: 'insert', component: 'useNotificationGenerator', actionName: 'notification.generate.piutang_sembako' })
        }
      }

      // 2. Notifikasi subscription
      const sub = getSubscriptionStatus(tenant)

      // Only notify for trial or active paid plans with imminent expiry
      if (sub.status === 'trial' || (sub.status === 'active' && sub.plan !== 'starter' && sub.isExpiringSoon)) {
        if (!existingKeys.has('subscription_expires' + tenant.id)) {
          const title = sub.status === 'trial' ? 'Trial Akan Berakhir' : `Langganan ${toTitleCase(sub.plan)} Akan Berakhir`
          const { error: e3 } = await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            type: 'subscription_expires',
            title,
            body: sub.status === 'trial'
              ? `Trial kamu berakhir dalam ${sub.daysLeft} hari.`
              : `Langganan ${toTitleCase(sub.plan)} kamu berakhir dalam ${sub.daysLeft} hari.`,
            action_url: `${basePath}/akun`,
            priority: 1,
            metadata: { ref_id: tenant.id, days_left: sub.daysLeft },
          })
          if (e3) logSupabaseError(e3, { table: 'notifications', operation: 'insert', component: 'useNotificationGenerator', actionName: 'notification.generate.subscription_expires' })
        }
      }

      // 3. Stok pakan menipis (peternak only)
      if (vertical?.startsWith('peternak')) {
        const { data: allStocks } = await supabase
          .from('feed_stocks')
          .select('*, peternak_farms(id, farm_name)')
          .eq('tenant_id', tenant.id)
          .order('feed_type', { ascending: true })

        for (const stock of (allStocks || []).filter(s => s.quantity_kg < 100)) {
          if (existingKeys.has('stok_pakan_menipis' + stock.id)) continue
          const { error: e4 } = await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            type: 'stok_pakan_menipis',
            title: 'Stok Pakan Menipis',
            body: `${stock.feed_type} tinggal ${stock.quantity_kg} kg.`,
            action_url: `${basePath}/pakan`,
            priority: 1,
            metadata: { ref_id: stock.id },
          })
          if (e4) logSupabaseError(e4, { table: 'notifications', operation: 'insert', component: 'useNotificationGenerator', actionName: 'notification.generate.stok_pakan' })
        }

        // 4. Tugas terlambat — one summary notif per day
        if (!existingKeys.has('tugas_terlambat' + todayStr)) {
          const { count: overdueCount } = await supabase
            .from('peternak_task_instances')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .eq('status', 'terlambat')

          if ((overdueCount ?? 0) > 0) {
            const { error: e5 } = await supabase.from('notifications').insert({
              tenant_id: tenant.id,
              type: 'tugas_terlambat',
              title: `${overdueCount} Tugas Terlambat`,
              body: `Ada ${overdueCount} tugas yang melewati tenggat waktu dan belum diselesaikan.`,
              action_url: `${basePath}/daily_task`,
              priority: 1,
              metadata: { ref_id: todayStr, count: overdueCount },
            })
            if (e5) logSupabaseError(e5, { table: 'notifications', operation: 'insert', component: 'useNotificationGenerator', actionName: 'notification.generate.tugas_terlambat' })
          }
        }

        // 5. Pengingat Gajian Pekerja
        const { data: workers } = await supabase
          .from('kandang_workers')
          .select('id, full_name, salary_type, pay_day, base_salary')
          .eq('tenant_id', tenant.id)
          .eq('status', 'aktif')

        for (const w of (workers || [])) {
          const daysUntil = calculateDaysUntilPayday(w.salary_type, w.pay_day)
          if (daysUntil === 0) {
            // Check if already paid this month (or week for weekly)
            const gracePeriod = new Date(today.getFullYear(), today.getMonth(), 1)
            gracePeriod.setDate(gracePeriod.getDate() - 5)

            const { data: alreadyPaid } = await supabase
              .from('kandang_worker_payments')
              .select('id')
              .eq('worker_id', w.id)
              .eq('payment_type', 'gaji')
              .eq('is_deleted', false)
              .gte('payment_date', gracePeriod.toISOString())
              .limit(1)

            if (alreadyPaid?.length > 0) continue // Skip if already paid

            const key = 'payday_reminder' + w.id + todayStr
            if (!existingKeys.has(key)) {
              const { error: e6 } = await supabase.from('notifications').insert({
                tenant_id: tenant.id,
                type: 'payday_reminder',
                title: 'Waktunya Gajian!',
                body: `Hari ini jadwal gajian ${w.full_name}. Segera catat pembayarannya.`,
                action_url: `${basePath}/tim`,
                priority: 1,
                metadata: { ref_id: w.id + todayStr, worker_id: w.id, amount: w.base_salary },
              })
              if (e6) logSupabaseError(e6, { table: 'notifications', operation: 'insert', component: 'useNotificationGenerator', actionName: 'notification.generate.payday' })
            }
          }
        }
      }

      // Always refetch after generation — don't rely solely on realtime
      // context.refetch() - REMOVED to prevent infinite loops
    } catch (err) {
      logError({ level: 'error', source: 'frontend', component: 'useNotificationGenerator', actionName: 'notification.generate.unexpected', error: err })
    }
  }

  useEffect(() => {
    checkAndGenerate()
  }, [tenant?.id, vertical])

  return { checkAndGenerate }
}
