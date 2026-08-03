import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

function TiltedCard({
  children,
  className = '',
  containerHeight = '100%',
  containerWidth = '100%',
  rotateAmplitude = 12,
  scaleOnHover = 1.03,
  showMobileWarning: _showMobileWarning = false,
  showTooltip: _showTooltip = false,
  displayOverlayContent: _displayOverlayContent = false,
  overlayContent: _overlayContent = null,
  imageAlt: _imageAlt = '',
  captionContent: _captionContent = null,
  style = {},
}) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const xSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const ySpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(ySpring, [-0.5, 0.5], [rotateAmplitude, -rotateAmplitude])
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [-rotateAmplitude, rotateAmplitude])

  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const xVal = (e.clientX - rect.left) / rect.width - 0.5
    const yVal = (e.clientY - rect.top) / rect.height - 0.5
    x.set(xVal)
    y.set(yVal)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  return (
    <div
      style={{
        width: containerWidth,
        height: containerHeight,
        perspective: '800px',
      }}
      className="tilted-card-wrapper"
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        style={{
          width: '100%',
          height: '100%',
          rotateX,
          rotateY,
          scale: isHovered ? scaleOnHover : 1,
          transformStyle: 'preserve-3d',
          transition: 'scale 0.2s ease',
          ...style,
        }}
        className={className}
      >
        {/* Shine overlay saat hover */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `radial-gradient(
              circle at ${isHovered ? 'var(--mouse-x, 50%) var(--mouse-y, 50%)' : '50% 50%'},
              rgba(2, 26, 2,0.08) 0%,
              transparent 70%
            )`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {children}
      </motion.div>
    </div>
  )
}

export default TiltedCard
