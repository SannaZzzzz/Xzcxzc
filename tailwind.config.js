/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'tech-grid': 'linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)',
      },
      colors: {
        'tech-blue': '#38bdf8',
        'tech-dark': '#0a0f1e',
        'tech-darker': '#050a14',
        'tech-gray': '#9ca3af',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'twinkle': 'twinkle 4s infinite',
        'blink': 'blink 2s infinite alternate',
        'shoot': 'shoot 4s linear infinite',
        'rotate': 'rotate 6s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        twinkle: {
          '0%': { opacity: '0.2' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.2' },
        },
        blink: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
        shoot: {
          '0%': { 
            transform: 'translateX(0) translateY(0)',
            opacity: '1',
          },
          '100%': { 
            transform: 'translateX(200px) translateY(200px)',
            opacity: '0',
          },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      boxShadow: {
        'neon': '0 0 5px rgba(56, 189, 248, 0.5), 0 0 10px rgba(56, 189, 248, 0.3)',
        'neon-hover': '0 0 10px rgba(56, 189, 248, 0.8), 0 0 20px rgba(56, 189, 248, 0.5)',
        'tech-frame': '0 0 15px rgba(28, 126, 214, 0.4), inset 0 0 8px rgba(28, 126, 214, 0.2)',
      },
      backdropFilter: {
        'tech': 'blur(8px)',
      },
    },
  },
  plugins: [],
}