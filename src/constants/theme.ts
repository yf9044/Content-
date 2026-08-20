/**
 * Brand tokens. These mirror `tailwind.config.js` and exist for the places React
 * Native still wants a raw colour value (status bar, tint props, ActivityIndicator).
 */
export const Brand = {
  paper: '#FDFBF7',
  surface: '#FFFFFF',
  ink: '#1C1917',
  muted: '#8A8177',
  stone: '#E7E1D8',
  flame: '#E4572E',
  ember: '#C2410C',
  cedar: '#1B7A43',
  saffron: '#F4A259',
  danger: '#D7263D',
} as const;

export type BrandColor = keyof typeof Brand;

export const MaxContentWidth = 720;
