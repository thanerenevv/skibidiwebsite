// Shared visual language for the pre-game (entry / lobby / host) experience.
// Keeps the redesigned screens cohesive without pulling in a CSS framework.

export const colors = {
  indigo: '#6366F1',
  violet: '#8B5CF6',
  purple: '#A855F7',
  pink: '#EC4899',
  blue: '#3B82F6',
  green: '#22C55E',
  red: '#EF4444',
  amber: '#F59E0B',
} as const;

export const accentGradient =
  'linear-gradient(135deg, #6366F1 0%, #8B5CF6 55%, #A855F7 100%)';

/** Frosted-glass surface used by every card on the entry screens. */
export const glassCard = {
  background: 'rgba(18,18,30,0.55)',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 12px 44px rgba(0,0,0,0.38)',
} as const;

/** Base style for the text inputs across the entry screens. */
export const fieldStyle = {
  width: '100%',
  padding: '14px 16px',
  border: '2px solid rgba(255,255,255,0.14)',
  borderRadius: 14,
  fontSize: 16,
  fontWeight: 600,
  outline: 'none',
  fontFamily: 'inherit',
  color: '#fff',
  background: 'rgba(255,255,255,0.06)',
  boxSizing: 'border-box',
  transition: 'border-color 180ms, background 180ms',
} as const;

export const focusField = (el: HTMLInputElement) => {
  el.style.borderColor = 'rgba(139,92,246,0.75)';
  el.style.background = 'rgba(255,255,255,0.09)';
};
export const blurField = (el: HTMLInputElement) => {
  el.style.borderColor = 'rgba(255,255,255,0.14)';
  el.style.background = 'rgba(255,255,255,0.06)';
};

/** Deterministic, pleasant avatar colour from a name/seed. */
export function avatarColor(seed: string): string {
  const code = (seed || '?').charCodeAt(0) || 0;
  const hue = (code * 47) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 62%, 56%), hsl(${(hue + 38) % 360}, 64%, 48%))`;
}
