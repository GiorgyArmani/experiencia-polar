import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de la UEP (brand book): azul claro #0079C7, azules oscuros #004572 / #00428D, amarillo #FFCC53.
        polar: {
          blue: '#0079C7',
          card: '#006AAE',
          shadow: '#004572',
          yellow: '#FFCC53',
          'yellow-dark': '#E5AC2E',
          ink: '#1E1E1E',
          cam: '#D9D9D9',
          sky: '#B5DDF4',
          lav: '#DCEFFB',
          'lav-ink': '#004572',
          'lav-dark': '#00428D',
          muted: '#49454F',
          navy: '#004572',
          'navy-2': '#00428D',
          ice: '#EAF3FB',
          cream: '#FFF6DD',
          slate: '#4A5872',
        },
      },
      fontFamily: {
        // Tipografías de la UEP: Poppins para el texto, Anton para los títulos grandes.
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Anton', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        game: '0 5px 0 #D29B22',
        'game-sm': '0 4px 0 #D29B22',
        arrow: '0 5px 0 #004572',
        'input-blue': '0 4px 0 #004572',
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
        // El oso tiembla cuando se acaba el tiempo (más rápido en los últimos segundos).
        tremble: 'shake 0.9s ease-in-out infinite',
        alarm: 'shake 0.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
