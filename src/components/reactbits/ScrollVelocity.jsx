import { useRef } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'

function wrap(min, max, v) {
  const rangeSize = max - min
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

function VelocityRow({ text, baseVelocity = 5 }) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false })

  // x goes from -50% to 0% (two copies side by side → seamless loop)
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`)

  const directionFactor = useRef(1)

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000)

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get()
    baseX.set(baseX.get() + moveBy)
  })

  // Duplicate text 4× so the loop is seamless regardless of text length
  const repeated = [text, text, text, text]

  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div className="inline-flex" style={{ x }}>
        {repeated.map((t, i) => (
          <span key={i} className="mr-16">
            {t}
          </span>
        ))}
        {/* Second copy for seamless wrap */}
        {repeated.map((t, i) => (
          <span key={`b-${i}`} className="mr-16">
            {t}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/**
 * ScrollVelocity
 *
 * Props:
 *   texts      — string[]   — array of text rows to scroll (default ['TernakOS'])
 *   velocity   — number     — base px/s speed (default 5)
 *   className  — string     — wrapper class
 */
function ScrollVelocity({ texts = ['TernakOS'], velocity = 5, className = '' }) {
  return (
    <div className={className}>
      {texts.map((text, i) => (
        <VelocityRow key={i} text={text} baseVelocity={i % 2 === 0 ? velocity : -velocity} />
      ))}
    </div>
  )
}

export default ScrollVelocity
