'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onSend: (text: string) => void
  isLoading: boolean
  isListening: boolean
  onListeningChange: (v: boolean) => void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

export default function ChatInput({ onSend, isLoading, isListening, onListeningChange }: Props) {
  const [text, setText] = useState('')
  const [hasSTT, setHasSTT] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setHasSTT('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  const submit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, isLoading, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const toggleListen = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      onListeningChange(false)
      return
    }

    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition
    const rec = new SpeechRec()
    rec.lang = 'pt-BR'
    rec.continuous = false
    rec.interimResults = true

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')
      setText(transcript)
    }

    rec.onend = () => {
      onListeningChange(false)
      const trimmed = text.trim()
      if (trimmed) {
        setTimeout(() => {
          onSend(trimmed)
          setText('')
        }, 200)
      }
    }

    rec.onerror = () => onListeningChange(false)

    recognitionRef.current = rec
    rec.start()
    onListeningChange(true)
  }, [isListening, onListeningChange, text, onSend])

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="flex items-end gap-2 bg-kimi-surface border border-kimi-border rounded-2xl p-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder="Digite ou fale para a Kimi..."
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-kimi-text text-sm placeholder:text-kimi-muted px-2 py-1.5 max-h-40"
          disabled={isLoading}
        />

        <div className="flex items-center gap-1.5 pb-0.5">
          {/* Botão de voz */}
          {hasSTT && (
            <motion.button
              onClick={toggleListen}
              disabled={isLoading}
              whileTap={{ scale: 0.9 }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-red-500 text-white'
                  : 'bg-kimi-border text-kimi-muted hover:bg-kimi-accent hover:text-white'
              }`}
              title={isListening ? 'Parar de ouvir' : 'Falar'}
            >
              <AnimatePresence mode="wait">
                {isListening ? (
                  <motion.span
                    key="stop"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-base"
                  >
                    ⏹
                  </motion.span>
                ) : (
                  <motion.span
                    key="mic"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-base"
                  >
                    🎤
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          {/* Botão de enviar */}
          <motion.button
            onClick={submit}
            disabled={isLoading || !text.trim()}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-xl bg-kimi-accent text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-kimi-accent2 transition-colors"
            title="Enviar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </motion.button>
        </div>
      </div>

      <p className="text-center text-kimi-muted text-xs mt-2">
        Enter para enviar · Shift+Enter para nova linha · 🎤 para falar
      </p>
    </div>
  )
}
