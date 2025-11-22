/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        'text-primary': '#000000',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
        'accent-purple': '#8B5CF6',
        'accent-blue': '#667EEA',
        'accent-indigo': '#6366F1',
        'hover-purple': '#7C3AED',
        'active-purple': '#6D28D9',
        success: '#10B981',
        'success-light': '#34D399',
      },
      backgroundImage: {
        'gradient-cosmic': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-cosmic-light': 'linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)',
        'gradient-cosmic-dark': 'linear-gradient(135deg, #4C51BF 0%, #5B21B6 100%)',
      },
      boxShadow: {
        'cosmic-sm': '0 1px 2px 0 rgba(139, 92, 246, 0.05)',
        'cosmic-md': '0 4px 6px -1px rgba(139, 92, 246, 0.1)',
        'cosmic-lg': '0 10px 15px -3px rgba(139, 92, 246, 0.15)',
        'cosmic-glow': '0 0 20px rgba(139, 92, 246, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
