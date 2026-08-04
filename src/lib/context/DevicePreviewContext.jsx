import React, { createContext, useContext } from 'react'

export const DevicePreviewContext = createContext({
  mode: 'desktop',
  simulatedWidth: null,
})

export function useDevicePreview() {
  return useContext(DevicePreviewContext)
}
