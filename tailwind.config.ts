import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        kimi: {
          bg: '#0a0a1a',
          surface: '#12122a',
          border: '#2a2a5a',
          accent: '#7c6cff',
          accent2: '#c084fc',
          text: '#e2e8f0',
          muted: '#64748b',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'blink': 'blink 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'mouth-talk': 'mouthTalk 0.3s ease-in-out infinite',
        'think-eyes': 'thinkEyes 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        blink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.05)' },
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px #7c6cff)' },
          '50%': { filter: 'drop-shadow(0 0 20px #c084fc)' },
        },
        mouthTalk: {
          '0%, 100%': { d: 'path("M 127 245 Q 150 258 173 245")' },
          '50%': { d: 'path("M 127 245 Q 150 265 173 245")' },
        },
        thinkEyes: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
