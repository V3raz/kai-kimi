'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Expression } from '@/types'

interface KaiAvatarProps {
  expression: Expression
  isSpeaking: boolean
  isListening: boolean
}

const EYES_KAI: Record<Expression, { left: string; right: string }> = {
  idle: {
    left:  'M 87 188 Q 112 170 137 188 Q 112 208 87 188 Z',
    right: 'M 163 188 Q 188 170 213 188 Q 188 208 163 188 Z',
  },
  talking: {
    left:  'M 87 188 Q 112 170 137 188 Q 112 208 87 188 Z',
    right: 'M 163 188 Q 188 170 213 188 Q 188 208 163 188 Z',
  },
  thinking: {
    left:  'M 90 193 Q 112 177 134 193 Q 112 208 90 193 Z',
    right: 'M 166 185 Q 188 167 210 185 Q 188 205 166 185 Z',
  },
  happy: {
    left:  'M 90 190 Q 112 172 134 190 Q 112 206 90 190 Z',
    right: 'M 166 190 Q 188 172 210 190 Q 188 206 166 190 Z',
  },
  surprised: {
    left:  'M 84 185 Q 112 160 140 185 Q 112 215 84 185 Z',
    right: 'M 160 185 Q 188 160 216 185 Q 188 215 160 185 Z',
  },
  processing: {
    left:  'M 87 188 Q 112 170 137 188 Q 112 208 87 188 Z',
    right: 'M 163 188 Q 188 170 213 188 Q 188 208 163 188 Z',
  },
}

const MOUTHS_KAI: Record<string, string> = {
  idle:       'M 130 252 Q 150 262 170 252',
  talking_o:  'M 132 248 Q 150 270 168 248 Q 150 260 132 248 Z',
  talking_c:  'M 130 252 Q 150 260 170 252',
  thinking:   'M 133 255 Q 150 250 167 255',
  happy:      'M 122 248 Q 150 272 178 248',
  surprised:  'M 136 244 Q 150 268 164 244 Q 150 257 136 244 Z',
  processing: 'M 133 253 Q 150 257 167 253',
}

function KaiEye({ path, cx, cy, pupilX, animate: anim }: {
  path: string; cx: number; cy: number; pupilX: number; animate: boolean
}) {
  return (
    <g>
      <path d={path} fill="white" />
      <motion.circle
        cx={cx} cy={cy} r={10} fill="#3b82f6"
        animate={anim ? { cx: [cx, cx + 3, cx - 3, cx] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <circle cx={cx} cy={cy} r={5.5} fill="#1a1a2e" />
      <circle cx={pupilX} cy={cy - 3} r={3} fill="white" />
      <circle cx={cx - 2} cy={cy + 2} r={1.2} fill="white" opacity={0.7} />
    </g>
  )
}

export default function KaiAvatar({ expression, isSpeaking, isListening }: KaiAvatarProps) {
  const eyes = EYES_KAI[expression]
  const isThinking = expression === 'thinking' || expression === 'processing'

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, #3b82f633 0%, transparent 70%)' }}
        animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.07, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <AnimatePresence>
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.15, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      <svg
        viewBox="0 0 300 380"
        width="280"
        height="340"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 12px #3b82f666)' }}
      >
        {/* Cabelo traseiro */}
        <ellipse cx="150" cy="182" rx="108" ry="115" fill="#1e3a5f" />

        {/* Laterais do cabelo */}
        <path d="M 44 195 Q 28 280 40 355 Q 65 335 72 270 Q 76 240 80 220" fill="#1a2f4a" />
        <path d="M 256 195 Q 272 280 260 355 Q 235 335 228 270 Q 224 240 220 220" fill="#1a2f4a" />

        {/* Pescoço */}
        <rect x="128" y="305" width="44" height="42" rx="5" fill="#f0d8c0" />

        {/* Corpo / gola */}
        <ellipse cx="150" cy="368" rx="95" ry="28" fill="#0f172a" />
        <path d="M 55 368 Q 78 345 128 340 Q 150 337 172 340 Q 222 345 245 368" fill="#0f172a" />
        {/* Colarinho */}
        <path d="M 128 340 L 138 355 L 150 345 L 162 355 L 172 340" stroke="#1e3a5f" strokeWidth="2" fill="#0f172a" />
        <line x1="150" y1="345" x2="150" y2="368" stroke="#1e3a5f" strokeWidth="1.5" opacity={0.5} />

        {/* Rosto */}
        <ellipse cx="150" cy="205" rx="96" ry="106" fill="#f0d8c0" />

        {/* Olho esquerdo */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.05, 1, 1] }}
          transition={{ duration: 5.5, repeat: Infinity, times: [0, 0.86, 0.9, 0.94, 1] }}
          style={{ transformOrigin: '112px 192px' }}
        >
          <KaiEye path={eyes.left} cx={112} cy={192} pupilX={116} animate={isThinking} />
        </motion.g>

        {/* Olho direito */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.05, 1, 1] }}
          transition={{ duration: 5.5, repeat: Infinity, times: [0, 0.86, 0.9, 0.94, 1], delay: 0.06 }}
          style={{ transformOrigin: '188px 192px' }}
        >
          <KaiEye path={eyes.right} cx={188} cy={192} pupilX={192} animate={isThinking} />
        </motion.g>

        {/* Sobrancelhas — mais retas e grossas que Kimi */}
        <motion.g
          animate={
            expression === 'surprised' ? { y: -6 } :
            expression === 'thinking'  ? { rotate: 10 } :
            expression === 'happy'     ? { rotate: -3 } : {}
          }
          style={{ transformOrigin: '110px 166px' }}
        >
          <path
            d="M 88 168 Q 112 162 136 168"
            stroke="#2d4a6e" strokeWidth="3.5" fill="none" strokeLinecap="round"
          />
        </motion.g>
        <motion.g
          animate={
            expression === 'surprised' ? { y: -6 } :
            expression === 'thinking'  ? { rotate: -5 } :
            expression === 'happy'     ? { rotate: 3 } : {}
          }
          style={{ transformOrigin: '188px 166px' }}
        >
          <path
            d="M 164 168 Q 188 162 212 168"
            stroke="#2d4a6e" strokeWidth="3.5" fill="none" strokeLinecap="round"
          />
        </motion.g>

        {/* Nariz — mais definido */}
        <path
          d="M 145 222 Q 148 232 151 232 Q 154 232 157 222"
          stroke="#d4a882" strokeWidth="1.8" fill="none" strokeLinecap="round"
        />

        {/* Boca */}
        <motion.path
          d={
            isSpeaking ? undefined :
            expression === 'happy'     ? MOUTHS_KAI.happy :
            expression === 'surprised' ? MOUTHS_KAI.surprised :
            expression === 'thinking'  ? MOUTHS_KAI.thinking :
            expression === 'processing'? MOUTHS_KAI.processing :
            MOUTHS_KAI.idle
          }
          animate={isSpeaking ? {
            d: [MOUTHS_KAI.talking_c, MOUTHS_KAI.talking_o, MOUTHS_KAI.talking_c]
          } : {}}
          transition={isSpeaking ? { duration: 0.35, repeat: Infinity, ease: 'easeInOut' } : {}}
          stroke="#b87c5a" strokeWidth="2.5"
          fill={isSpeaking || expression === 'surprised' ? '#b87c5a' : 'none'}
          strokeLinecap="round"
        />

        {/* Cabelo (frente) — spiky */}
        <path
          d="M 46 188 Q 52 118 90 102 Q 78 82 88 68 Q 100 88 108 96 Q 120 74 130 68 Q 138 86 140 96 Q 150 78 160 70 Q 165 88 162 98 Q 172 78 182 72 Q 185 90 178 104 Q 210 92 248 120 Q 254 160 254 188"
          fill="#1e3a5f"
        />
        {/* Detalhes do cabelo */}
        <path d="M 88 68 Q 78 50 84 36 Q 96 58 108 68" fill="#152a47" />
        <path d="M 130 68 Q 130 48 136 36 Q 142 52 140 68" fill="#152a47" />
        <path d="M 182 72 Q 192 52 196 40 Q 198 60 186 72" fill="#152a47" />

        {/* Indicador de processamento */}
        <AnimatePresence>
          {expression === 'processing' && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx={134 + i * 16} cy={290} r={4}
                  fill="#3b82f6"
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  )
}
