import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        polar: {
          blue: '#2A7EEB',
          card: '#236AC8',
          shadow: '#1B5FBF',
          orange: '#FF8D28',
          'orange-dark': '#C9620A',
          ink: '#1E1E1E',
          cam: '#D9D9D9',
          sky: '#A9D3F0',
          lav: '#E8DEF8',
          'lav-ink': '#4A4458',
          'lav-dark': '#625B71',
          muted: '#49454F',
          navy: '#0B2A66',
          'navy-2': '#1A3D80',
          ice: '#EAF3FB',
          clay: '#F07A22',
          slate: '#4A5872',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Figtree', 'sans-serif'],
        figtree: ['Figtree', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        game: '0 5px 0 #C9620A',
        'game-sm': '0 4px 0 #C9620A',
        arrow: '0 5px 0 #1B5FBF',
        'input-blue': '0 4px 0 #1B5FBF',
      },
      keyframes: {
        blink: { '0%,92%,100%': { transform: 'scaleY(1)' }, '95%': { transform: 'scaleY(0.1)' } },
        breathe: { '0%,100%': { transform: 'translateY(0) scale(1)' }, '50%': { transform: 'translateY(2px) scale(1.01,0.99)' } },
        zzz: { '0%': { transform: 'translate(0,0) scale(0.6)', opacity: '0' }, '30%': { opacity: '1' }, '100%': { transform: 'translate(14px,-34px) scale(1.1)', opacity: '0' } },
        wiggle: { '0%,100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-6deg)' }, '75%': { transform: 'rotate(6deg)' } },
        sweat: { '0%': { transform: 'translateY(0)', opacity: '0' }, '20%': { opacity: '1' }, '100%': { transform: 'translateY(10px)', opacity: '0' } },
        scan: { '0%,100%': { top: '10%' }, '50%': { top: '86%' } },
        hop: {
          '0%,100%': { transform: 'translateY(0) scale(1)' },
          '35%': { transform: 'translateY(-26px) scale(1.02)' },
          '55%': { transform: 'translateY(0) scale(1.03,0.97)' },
          '70%': { transform: 'translateY(-8px)' },
        },
        fall: {
          '0%': { transform: 'translateY(-40px) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(640px) rotate(540deg)', opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.6) rotate(-4deg)', opacity: '0' },
          '60%': { transform: 'scale(1.08) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-2deg)', opacity: '1' },
        },
        shake: {
          '0%,100%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(-4deg)' },
          '30%': { transform: 'rotate(4deg)' },
          '45%': { transform: 'rotate(-3deg)' },
          '60%': { transform: 'rotate(3deg)' },
          '75%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        blink: 'blink 4.2s ease-in-out infinite',
        breathe: 'breathe 3s ease-in-out infinite',
        zzz: 'zzz 2.4s ease-out infinite',
        wiggle: 'wiggle 0.5s ease-in-out 2',
        sweat: 'sweat 1.4s ease-in infinite',
        scan: 'scan 2.6s ease-in-out infinite',
        hop: 'hop 1.4s ease-in-out infinite',
        pop: 'pop 0.6s ease-out both',
        shake: 'shake 1.2s ease-in-out 0.2s 2',
      },
    },
  },
  plugins: [],
};

export default config;
