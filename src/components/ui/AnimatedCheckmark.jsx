import React, { useEffect, useRef } from 'react';
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

      pathRef.current.animate(
        [
          { strokeDashoffset: pathLength },
          { strokeDashoffset: 0 }
        ],
        {
          duration: 600,
          delay: 200,
          easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
          fill: 'forwards'
        }
      );
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
