/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // The app is light-only for now; `class` also stops react-native-css-interop
  // from throwing when Expo forces the colour scheme on web.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm paper-and-ink base, so food photography stays the loudest thing on screen.
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
      },
      borderRadius: {
        card: '18px',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};
