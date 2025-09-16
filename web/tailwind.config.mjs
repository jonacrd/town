/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          fg: '#FFFFFF'
        },
        accent: '#22C55E',
        warm: '#F97316',
        ink: '#0F172A',
        muted: '#64748B',
        surface: '#FFFFFF',
        bg: '#F8FAFC'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'soft': '0.5rem'
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'soft-lg': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
      }
    },
  },
  plugins: [],
};
