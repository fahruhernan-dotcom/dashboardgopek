import { useRef, useCallback } from 'react'

function ClickSpark({
  children,
  sparkColor = '#021a02',
  sparkSize = 8,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
}) {
  const canvasRef = useRef(null)

  const createSpark = useCallback((x, y) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const cx = x - rect.left
    const cy = y - rect.top

    const sparks = Array.from({ length: sparkCount }, (_, i) => ({
      x: cx,
      y: cy,
      angle: (i / sparkCount) * Math.PI * 2,
      speed: 1 + Math.random() * 2,
      life: 1,
    }))

    const start = performance.now()
    
    const animate = (now) => {
      const elapsed = now - start
      const progress = elapsed / duration
      
      if (progress >= 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      sparks.forEach(spark => {
        const dist = spark.speed * sparkRadius * progress
        const sx = spark.x + Math.cos(spark.angle) * dist
        const sy = spark.y + Math.sin(spark.angle) * dist
        const alpha = 1 - progress
        
        ctx.beginPath()
        ctx.arc(sx, sy, sparkSize * (1 - progress) / 2, 0, Math.PI * 2)
        ctx.fillStyle = sparkColor + Math.round(alpha * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })
      
      requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }, [sparkColor, sparkCount, sparkRadius, sparkSize, duration])

  const handleClick = (e) => {
    createSpark(e.clientX, e.clientY)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onClick={handleClick}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        width={typeof window !== 'undefined' ? window.innerWidth : 1920}
        height={typeof window !== 'undefined' ? window.innerHeight : 1080}
      />
      {children}
    </div>
  )
}

export default ClickSpark
