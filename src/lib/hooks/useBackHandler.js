import { useEffect, useRef } from 'react'

/**
 * Custom hook to intercept Android hardware back button / gesture when a modal, sheet,
 * or sidebar is open.
 *
 * @param {boolean} isOpen - Whether the modal or sheet is currently visible.
 * @param {Function} onClose - Callback function to close the modal when back button is pressed.
 */
export function useBackHandler(isOpen, onClose) {
  const isPushedRef = useRef(false)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      if (isPushedRef.current) {
        isPushedRef.current = false
        if (window.history.state?.modalOpen) {
          window.history.back()
        }
      }
      return
    }

    // Push dummy modal state to history stack
    window.history.pushState({ modalOpen: true }, '')
    isPushedRef.current = true

    const handlePopState = (e) => {
      if (isPushedRef.current) {
        isPushedRef.current = false
        if (onCloseRef.current) {
          onCloseRef.current()
        }
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen])
}
