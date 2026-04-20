'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Expression } from '@/types'

interface AvatarProps {
  expression: Expression
  isSpeaking: boolean
  isListening: boolean
}

const EYES: Record<Expression, { left: string; right: string }> = {
  idle: {
    left:  'M 87 185 Q 112 165 137 185 Q 112 210 87 185 Z',
    right: 'M 163 185 Q 188 165 213 185 Q 188 210 163 185 Z',
  },
  talking: {
    left:  'M 87 185 Q 112 165 137 185 Q 112 210 87 185 Z',
    right: 'M 163 185 Q 188 165 213 185 Q 188 210 163 185 Z',
  },
  thinking: {
    left:  'M 87 190 Q 112 172 137 190 Q 112 208 87 190 Z',
    right: 'M 163 182 Q 188 162 213 182 Q 188 205 163 182 Z',
  },
  happy: {
    left:  'M 87 188 Q 112 162 137 188 Q 112 204 87 188 Z',
    right: 'M 163 188 Q 188 162 213 188 Q 188 204 163 188 Z',
  },
  surprised: {
    left:  'M 85 183 Q 112 158 139 183 Q 112 215 85 183 Z',
    right: 'M 161 183 Q 188 158 215 183 Q 188 215 161 183 Z',
  },
  processing: {
    left:  'M 87 185 Q 112 165 137 185 Q 112 210 87 185 Z',
    right: 'M 163 185 Q 188 165 213 185 Q 188 210 163 185 Z',
  },
}

const MOUTHS: Record<string, string> = {
  idle:       'M 127 248 Q 150 262 173 248',
  talking_o:  'M 130 245 Q 150 268 170 245 Q 150 258 130 245 Z',
  talking_c:  'M 127 248 Q 150 258 173 248',
  thinking:   'M 130 252 Q 148 248 168 252',
  happy:      'M 120 244 Q 150 270 180 244',
  surprised:  'M 135 242 Q 150 268 165 242 Q 150 255 135 242 Z',
  processing: 'M 130 250 Q 150 255 170 250',
}

function EyeShape({ path, cx, cy, pupilX, animate: anim }: {
  path: string; cx: number; cy: number; pupilX: number; animate: boolean
}) {
  return (
    <g>
      <path d={path} fill="white" />
      <motion.circle
        cx={cx} cy={cy} r={11} fill="#7c6cff"
        animate={anim ? { cx: [cx, cx + 3, cx - 3, cx] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <circle cx={cx} cy={cy} r={6} fill="#1a1a2e" />
      <circle cx={pupilX} cy={cy - 4} r={3.5} fill="white" />
      <circle cx={cx - 3} cy={cy + 3} r={1.5} fill="white" opacity={0.7} />
    </g>
  )
}

export default function Avatar({ expression, isSpeaking, isListening }: AvatarProps) {
  const eyes = EYES[expression]
  const isThinking = expression === 'thinking' || expression === 'processing'

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Glow de fundo */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, #7c6cff33 0%, transparent 70%)' }}
        animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Indicador de escuta */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-kimi-accent2"
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
        style={{ filter: 'drop-shadow(0 0 12px #7c6cff66)' }}
      >
        {/* Cabelo traseiro */}
        <ellipse cx="150" cy="185" rx="105" ry="118" fill="#2d1b69" />
        <path
          d="M 48 210 Q 30 300 45 360 Q 70 340 80 280 Q 85 250 90 230"
          fill="#2d1b69" stroke="#2d1b69" strokeWidth="2"
        />
        <path
          d="M 252 210 Q 270 300 255 360 Q 230 340 220 280 Q 215 250 210 230"
          fill="#2d1b69" stroke="#2d1b69" strokeWidth="2"
        />

        {/* Pescoço */}
        <rect x="130" y="305" width="40" height="40" rx="6" fill="#fde8d0" />

        {/* Ombros / corpo */}
        <ellipse cx="150" cy="365" rx="90" ry="30" fill="#1e1040" />
        <path
          d="M 60 365 Q 80 345 130 340 Q 150 338 170 340 Q 220 345 240 365"
          fill="#1e1040"
        />
        {/* Detalhe de roupa */}
        <path
          d="M 120 342 Q 150 350 180 342"
          stroke="#7c6cff" strokeWidth="2" fill="none" opacity={0.6}
        />

        {/* Rosto */}
        <ellipse cx="150" cy="205" rx="98" ry="108" fill="#fde8d0" />

        {/* Bochechas */}
        <ellipse cx="88" cy="228" rx="16" ry="9" fill="#ffb6c1" opacity={0.45} />
        <ellipse cx="212" cy="228" rx="16" ry="9" fill="#ffb6c1" opacity={0.45} />

        {/* Olho esquerdo */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.05, 1, 1] }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.88, 0.91, 0.94, 1] }}
          style={{ transformOrigin: '112px 190px' }}
        >
          <EyeShape
            path={eyes.left}
            cx={112} cy={190} pupilX={116}
            animate={isThinking}
          />
        </motion.g>

        {/* Olho direito */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.05, 1, 1] }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.88, 0.91, 0.94, 1], delay: 0.05 }}
          style={{ transformOrigin: '188px 190px' }}
        >
          <EyeShape
            path={eyes.right}
            cx={188} cy={190} pupilX={192}
            animate={isThinking}
          />
        </motion.g>

        {/* Sobrancelhas */}
        <motion.g
          animate={
            expression === 'surprised' ? { y: -5 } :
            expression === 'happy'     ? { rotate: -5 } :
            expression === 'thinking'  ? { rotate: 8 } : {}
          }
          style={{ transformOrigin: '112px 168px' }}
        >
          <path
            d="M 90 168 Q 112 160 134 166"
            stroke="#4a3080" strokeWidth="3" fill="none" strokeLinecap="round"
          />
        </motion.g>
        <motion.g
          animate={
            expression === 'surprised' ? { y: -5 } :
            expression === 'happy'     ? { rotate: 5 } :
            expression === 'thinking'  ? { rotate: -4 } : {}
          }
          style={{ transformOrigin: '188px 168px' }}
        >
          <path
            d="M 166 166 Q 188 160 210 168"
            stroke="#4a3080" strokeWidth="3" fill="none" strokeLinecap="round"
          />
        </motion.g>

        {/* Nariz */}
        <path
          d="M 147 222 Q 150 228 153 222"
          stroke="#e8a87c" strokeWidth="1.8" fill="none" strokeLinecap="round"
        />

        {/* Boca animada */}
        <motion.path
          d={
            isSpeaking ? undefined :
            expression === 'happy'     ? MOUTHS.happy :
            expression === 'surprised' ? MOUTHS.surprised :
            expression === 'thinking'  ? MOUTHS.thinking :
            expression === 'processing'? MOUTHS.processing :
            MOUTHS.idle
          }
          animate={isSpeaking ? {
            d: [MOUTHS.talking_c, MOUTHS.talking_o, MOUTHS.talking_c]
          } : {}}
          transition={isSpeaking ? { duration: 0.35, repeat: Infinity, ease: 'easeInOut' } : {}}
          stroke="#c8866c" strokeWidth="2.5" fill={
            isSpeaking || expression === 'surprised' ? '#c8866c' : 'none'
          }
          strokeLinecap="round"
        />

        {/* Cabelo (franja — frente) */}
        <path
          d="M 52 180 Q 58 110 95 108 Q 108 85 130 90 Q 150 80 170 90 Q 192 85 205 108 Q 242 110 248 180"
          fill="#3d2280"
        />
        <path
          d="M 52 180 Q 65 145 80 155 Q 90 125 112 132 Q 118 105 145 110"
          fill="#2d1b69"
        />
        <path
          d="M 248 180 Q 235 145 220 155 Q 210 125 188 132 Q 182 105 158 110"
          fill="#2d1b69"
        />
        {/* Mecha lateral esquerda */}
        <path
          d="M 52 180 Q 44 220 48 260 Q 60 240 65 195"
          fill="#3d2280"
        />

        {/* Indicador de processamento */}
        <AnimatePresence>
          {expression === 'processing' && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx={134 + i * 16} cy={290} r={4}
                  fill="#7c6cff"
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
