import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * InfiniteScroll
 *
 * Props:
 *   items      — any[]         — array of React nodes or strings to render
 *   speed      — number        — scroll speed in px/s (default 40)
 *   direction  — 'left'|'right'— scroll direction (default 'left')
 *   gap        — number        — gap in px between items (default 40)
 *   className  — string        — wrapper class
 *   itemClass  — string        — class applied to each item wrapper
 *   pauseOnHover — boolean     — pause on hover (default true)
 */
function InfiniteScroll({
  items = [],
  speed = 40,
  direction = 'left',
  gap = 40,
  className = '',
  itemClass = '',
  pauseOnHover = true,
}) {
  const trackRef = useRef(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const [paused, setPaused] = useState(false)

  // Measure track width after render
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setTrackWidth(el.scrollWidth / 2) // half because we duplicate
    })
    observer.observe(el)
    setTrackWidth(el.scrollWidth / 2)
    return () => observer.disconnect()
  }, [items])

  // Duration: distance / speed
  const duration = trackWidth > 0 ? trackWidth / speed : 20

  // Animation: scroll one full copy width, then snap back
  const from = direction === 'left' ? 0 : -trackWidth
  const to   = direction === 'left' ? -trackWidth : 0

  // Duplicate items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <motion.div
        ref={trackRef}
        className="flex"
        style={{ gap, width: 'max-content' }}
        animate={{ x: paused ? undefined : [from, to] }}
        transition={{
          duration,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        {doubled.map((item, i) => (
          <div key={i} className={`flex-shrink-0 ${itemClass}`}>
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default InfiniteScroll
