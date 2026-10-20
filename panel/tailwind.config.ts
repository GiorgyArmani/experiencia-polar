import type { Config } from 'tailwindcss';

// Misma paleta que el juego (Elementos EP), solo los colores que usa el panel.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        polar: {
          navy: '#0E0C4E',
          blue: '#0351A3',
          yellow: '#FFCC53',
          ink: '#1E1E1E',
          ice: '#F4F4F4',
          slate: '#4A5872',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Anton', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
