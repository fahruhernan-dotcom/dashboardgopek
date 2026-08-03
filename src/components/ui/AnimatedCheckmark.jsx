import React, { useEffect, useRef } from 'react';
import anime from '../../lib/animation';
import { useInView } from 'framer-motion';

const AnimatedCheckmark = ({ className = "" }) => {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const isInView = useInView(svgRef, { once: true, margin: "-10%" });

  useEffect(() => {
    if (isInView && pathRef.current) {
      // Get the path length
      const pathLength = pathRef.current.getTotalLength();
      
      // Set initial dash attributes
      pathRef.current.setAttribute('stroke-dasharray', pathLength);
      pathRef.current.setAttribute('stroke-dashoffset', pathLength);

      anime({
        targets: pathRef.current,
        strokeDashoffset: [pathLength, 0],
        duration: 600,
        easing: 'easeOutQuart',
        delay: 200
      });
    }
  }, [isInView]);

  return (
    <svg 
      ref={svgRef}
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        ref={pathRef}
        d="M20 6L9 17L4 12" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

export default AnimatedCheckmark;
