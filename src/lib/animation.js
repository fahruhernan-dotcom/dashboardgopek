import { animate, createTimeline, stagger } from 'animejs';

/**
 * Compatibility wrapper for Anime.js v3 style calls
 * @param {Object} params 
 */
const anime = (params) => {
  const { targets, ...rest } = params;
  return animate(targets, rest);
};

// Attach v3-style helpers
anime.timeline = (params) => createTimeline(params);
anime.stagger = stagger;

/**
 * Premium stagger reveal for text elements
 */
export const revealText = (targets, options = {}) => {
  return animate(targets, {
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 800,
    delay: stagger(100),
    easing: 'easeOutExpo',
    ...options
  });
};

/**
 * High-energy elastic entry for UI elements
 */
export const elasticEntry = (targets, delay = 0) => {
  return animate(targets, {
    scale: [0.9, 1],
    opacity: [0, 1],
    duration: 1200,
    delay,
    easing: 'easeOutElastic(1, .5)'
  });
};

/**
 * Creates a standard landing page entrance timeline
 */
export const createEntranceTimeline = (params = {}) => {
  return createTimeline({
    easing: 'easeOutExpo',
    ...params
  });
};

export { animate, createTimeline, stagger };
export default anime;
