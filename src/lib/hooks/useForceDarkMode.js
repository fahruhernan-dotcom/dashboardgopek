/**
 * useForceDarkMode
 * Hook untuk memaksa dark mode saat berada di halaman dashboard.
 * Saat unmount (user keluar dashboard ke landing page),
 * theme dikembalikan ke preferensi user dari localStorage.
 */
import { useEffect } from 'react'

export function useForceDarkMode() {
  useEffect(() => {
    // Force dark saat masuk dashboard
    document.documentElement.classList.add('dark')

    return () => {
      // Restore preferensi user saat keluar dashboard
      const saved = localStorage.getItem('ternakos_theme_mode')
      if (saved === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])
}
