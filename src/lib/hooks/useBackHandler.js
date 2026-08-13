import { useEffect, useRef } from 'react'

/**
 * Custom hook to intercept Android hardware back button / Escape key when a modal, sheet,
 * or sidebar is open, without corrupting the browser/React Router history stack.
 *
 * @param {boolean} isOpen - Whether the modal or sheet is currently visible.
 * @param {Function} onClose - Callback function to close the modal when back button is pressed.
 */
export function useBackHandler(isOpen, onClose) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    // 1. Web / Desktop Escape key listener
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (onCloseRef.current) {
          onCloseRef.current()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)

    // 2. Capacitor Android hardware back button listener
    let removeCapacitorListener = null
    const setupCapacitorBack = async () => {
      try {
        const NativeApp = window.Capacitor?.Plugins?.App
        if (NativeApp?.addListener) {
          const handler = await NativeApp.addListener('backButton', (data) => {
            if (onCloseRef.current) {
              onCloseRef.current()
            }
          })
          removeCapacitorListener = () => {
            if (handler?.remove) {
              handler.remove()
            }
          }
        }
      } catch (err) {
        console.warn('[useBackHandler] Capacitor backButton listener error:', err)
      }
    }

    setupCapacitorBack()

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      if (removeCapacitorListener) {
        removeCapacitorListener()
      }
    }
  }, [isOpen])
}
