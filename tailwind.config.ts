import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta del Juego Aniversario UEP (Elementos EP): índigo #0E0C4E, azul rey #0351A3, azul acero #4587C5,
        // azul brillante #008CFD, amarillo #FFCC53, gris claro #F4F4F4; acentos cian #00C3DA y lima #DEDE00.
        polar: {
          blue: '#0351A3',
          bright: '#008CFD',
          steel: '#4587C5',
          card: '#003088',
          shadow: '#0E0C4E',
          yellow: '#FFCC53',
          'yellow-dark': '#E5AC2E',
          cyan: '#00C3DA',
          lime: '#DEDE00',
          ink: '#1E1E1E',
          cam: '#E4E9F1',
          sky: '#C4E2FF',
          lav: '#E3F1FF',
          'lav-ink': '#0E0C4E',
          'lav-dark': '#0E0C4E',
          muted: '#49454F',
          navy: '#0E0C4E',
          'navy-2': '#003088',
          ice: '#F4F4F4',
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
        arrow: '0 5px 0 #0E0C4E',
        'input-blue': '0 4px 0 #0E0C4E',
      },
      keyframes: {
        blink: { '0%,92%,100%': { transform: 'scaleY(1)' }, '95%': { transform: 'scaleY(0.1)' } },
        breathe: { '0%,100%': { transform: 'translateY(0) scale(1)' }, '50%': { transform: 'translateY(2px) scale(1.01,0.99)' } },
        zzz: { '0%': { transform: 'translate(0,0) scale(0.6)', opacity: '0' }, '30%': { opacity: '1' }, '100%': { transform: 'translate(14px,-34px) scale(1.1)', opacity: '0' } },
        wiggle: { '0%,100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-6deg)' }, '75%': { transform: 'rotate(6deg)' } },
        sweat: { '0%': { transform: 'translateY(0)', opacity: '0' }, '20%': { opacity: '1' }, '100%': { transform: 'translateY(10px)', opacity: '0' } },
        scan: { '0%,100%': { top: '10%' }, '50%': { top: '86%' } },
        walk: { '0%,100%': { transform: 'translateY(0) rotate(-4deg)' }, '50%': { transform: 'translateY(-14%) rotate(4deg)' } },
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
        // Igual que pop pero sin girar: para textos que deben quedar derechos (las preguntas).
        'pop-straight': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '60%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
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
        walk: 'walk 0.38s ease-in-out infinite',
        hop: 'hop 1.4s ease-in-out infinite',
        pop: 'pop 0.6s ease-out both',
        'pop-straight': 'pop-straight 0.45s ease-out both',
        shake: 'shake 1.2s ease-in-out 0.2s 2',
        // El ícono tiembla cuando se acaba el tiempo (más rápido en los últimos segundos).
        tremble: 'shake 0.9s ease-in-out infinite',
        alarm: 'shake 0.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
