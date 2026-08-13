import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from '@/lib/supabase'

let isInitialized = false

/**
 * Inisialisasi Push Notifications pada Android / iOS
 * @param {Object} params
 * @param {string} params.tenantId - ID Tenant aktif
 * @param {string} params.userId - ID User terautentikasi
 * @param {Function} [params.onNavigate] - Callback navigasi deep link (opsional)
 */
export async function initPushNotifications({ tenantId, userId, onNavigate }) {
  if (!Capacitor.isNativePlatform()) {
    // Pada browser web biasa, Push Notifications native dilewati
    return { supported: false, reason: 'web_environment' }
  }

  if (isInitialized) {
    return { supported: true, initialized: true }
  }

  try {
    // 1. Periksa dan minta izin notifikasi OS
    let permStatus = await PushNotifications.checkPermissions()

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
    }

    if (permStatus.receive !== 'granted') {
      return { supported: true, granted: false, reason: 'permission_denied' }
    }

    // 2. Daftarkan perangkat ke FCM
    await PushNotifications.register()

    // 3. Listener: Sukses mendapatkan token FCM
    await PushNotifications.addListener('registration', async (token) => {
      if (!token?.value || !tenantId || !userId) return

      try {
        // Panggil helper function atomic upsert di Supabase
        await supabase.rpc('register_device_token', {
          p_tenant_id: tenantId,
          p_device_token: token.value,
          p_platform: Capacitor.getPlatform() || 'android',
          p_device_name: navigator?.userAgent?.slice(0, 100) || 'Android Device',
        })
      } catch (err) {
        console.error('[PushNotification] Gagal menyimpan token ke Supabase:', err)
      }
    })

    // 4. Listener: Error registrasi
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[PushNotification] Registration error:', error)
    })

    // 5. Listener: Notifikasi diterima saat aplikasi aktif di foreground
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // In-app banner / trigger query refresh
      window.dispatchEvent(new CustomEvent('gopek:push-received', { detail: notification }))
    })

    // 6. Listener: User tap notifikasi dari status bar Android
    await PushNotifications.addListener('pushNotificationActionPerformed', (notificationAction) => {
      const data = notificationAction?.notification?.data
      const targetRoute = data?.route || data?.url

      if (targetRoute) {
        if (typeof onNavigate === 'function') {
          onNavigate(targetRoute)
        } else {
          window.location.href = targetRoute
        }
      }
    })

    isInitialized = true
    return { supported: true, granted: true }
  } catch (error) {
    console.error('[PushNotification] Error inisialisasi push notification:', error)
    return { supported: true, error: error.message }
  }
}
