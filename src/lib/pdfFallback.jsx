import React from 'react'

export const Document = ({ children }) => <div>{children}</div>
export const Page = ({ children }) => <div>{children}</div>
export const Text = ({ children }) => <span>{children}</span>
export const View = ({ children }) => <div>{children}</div>
export const StyleSheet = { create: (styles) => styles }
export const PDFViewer = ({ children, width, height }) => (
  <div style={{ width: width || '100%', height: height || '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111C24', color: '#94A3B8', borderRadius: '12px' }}>
    <p className="text-xs text-[#94A3B8]">PDF Preview tidak tersedia (Modul @react-pdf/renderer belum di-install)</p>
  </div>
)
export const PDFDownloadLink = ({ children }) => (
  <div className="w-full sm:w-auto sm:ml-auto">
    {typeof children === 'function' ? children({ loading: false }) : children}
  </div>
)
