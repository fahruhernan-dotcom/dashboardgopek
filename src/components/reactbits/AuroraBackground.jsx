function AuroraBackground({ children, className = "", style = {} }) {
  return (
    <div 
      className={className}
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        background: '#06090F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style
      }}
    >

      {/* Aurora layer 1 — emerald besar */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '70%',
        height: '70%',
        background: 'radial-gradient(ellipse, rgba(2, 26, 2,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'aurora1 8s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />

      {/* Aurora layer 2 — teal, bergerak berlawanan */}
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.10) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'aurora2 10s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />

      {/* Aurora layer 3 — emerald kecil, cepat */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '60%',
        width: '35%',
        height: '35%',
        background: 'radial-gradient(ellipse, rgba(2, 26, 2,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        animation: 'aurora3 6s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />

      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 80% at center, black 20%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 20%, transparent 75%)',
        pointerEvents: 'none',
      }} />

      {/* Vignette tepi */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 90% 90% at center, transparent 40%, rgba(6,9,15,0.8) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
        {children}
      </div>

    </div>
  )
}

export default AuroraBackground
