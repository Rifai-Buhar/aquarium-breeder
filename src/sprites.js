// ============================================
// FISH SPRITE DEFINITIONS
// ============================================

export const FISH_SPRITE = [
  '..XXXXX..',
  '.XXXXXXX.',
  'TXXXXXXXXE',
  '.XXXXXXX.',
  '..XXXXX..',
];

/**
 * Shade a hex color by amount (-255 to 255)
 */
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = clamp((n >> 16) + amt, 0, 255);
  let g = clamp(((n >> 8) & 255) + amt, 0, 255);
  let b = clamp((n & 255) + amt, 0, 255);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

export { clamp };