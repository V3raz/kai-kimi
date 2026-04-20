'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

interface Props {
  onSend: (text: string) => void
  isLoading: boolean
  isListening: boolean
  onListeningChange: (v: boolean) => void
  conversationMode: boolean
  onConversationModeChange: (v: boolean) => void
  triggerAutoListen: number
}

export default function ChatInput({
  onSend, isLoading, isListening, onListeningChange,
  conversationMode, onConversationModeChange, triggerAutoListen,
}: Props) {
  const [text, setText] = useState('')
  const [hasSTT, setHasSTT] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTextRef = useRef('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setHasSTT('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  const submit = useCallback((overrideText?: string) => {
    const trimmed = (overrideText ?? text).trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setText('')
    pendingTextRef.current = ''
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, isLoading, onSend])

  const startListening = useCallback(() => {
    if (isLoading) return
    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRec) return

    const rec = new SpeechRec()
    rec.lang = 'pt-BR'
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('')
      setText(transcript)
      pendingTextRef.current = transcript

      // Silence detection: 1.8s sem novos resultados → envia
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        rec.stop()
      }, 1800)
    }

    rec.onend = () => {
      onListeningChange(false)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      const pending = pendingTextRef.current.trim()
      if (pending) {
        setTimeout(() => submit(pending), 100)
      }
    }

    rec.onerror = () => {
      onListeningChange(false)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }

    recognitionRef.current = rec
    rec.start()
    onListeningChange(true)
  }, [isLoading, onListeningChange, submit])

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    recognitionRef.current?.stop()
    onListeningChange(false)
  }, [onListeningChange])

  const toggleListen = useCallback(() => {
    if (isListening) { stopListening(); return }
    startListening()
  }, [isListening, startListening, stopListening])

  // Ativado pelo pai (após TTS terminar em modo conversa)
  useEffect(() => {
    if (triggerAutoListen > 0 && conversationMode && !isLoading) {
      const t = setTimeout(startListening, 400)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAutoListen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Modo conversa banner */}
      <AnimatePresence>
        {conversationMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-2"
          >
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-kimi-accent/10 border border-kimi-accent/30">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 rounded-full bg-kimi-accent"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="text-xs text-kimi-accent font-medium">
                  {isListening ? 'Ouvindo...' : isLoading ? 'Processando...' : 'Modo conversa ativo — fale a qualquer momento'}
                </span>
              </div>
              <button
                onClick={() => { onConversationModeChange(false); stopListening() }}
                className="text-xs text-kimi-muted hover:text-kimi-text"
              >
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 bg-kimi-surface border border-kimi-border rounded-2xl p-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder={conversationMode ? 'Fale ou escreva...' : 'Digite ou fale para a Kimi...'}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-kimi-text text-sm placeholder:text-kimi-muted px-2 py-1.5 max-h-40"
          disabled={isLoading}
        />

        <div className="flex items-center gap-1.5 pb-0.5">
          {/* Botão modo conversa */}
          {hasSTT && (
            <motion.button
              onClick={() => {
                const next = !conversationMode
                onConversationModeChange(next)
                if (next) startListening()
                else stopListening()
              }}
              whileTap={{ scale: 0.9 }}
              title={conversationMode ? 'Desativar modo conversa' : 'Ativar modo conversa (sem apertar Enter)'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-sm ${
                conversationMode
                  ? 'bg-kimi-accent text-white'
                  : 'bg-kimi-border text-kimi-muted hover:bg-kimi-accent/20 hover:text-kimi-accent'
              }`}
            >
              🗣
            </motion.button>
          )}

          {/* Botão microfone manual */}
          {hasSTT && !conversationMode && (
            <motion.button
              onClick={toggleListen}
              disabled={isLoading}
              whileTap={{ scale: 0.9 }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-red-500 text-white'
                  : 'bg-kimi-border text-kimi-muted hover:bg-kimi-accent hover:text-white'
              }`}
              title={isListening ? 'Parar' : 'Falar'}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isListening ? 'stop' : 'mic'}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="text-base"
                >
                  {isListening ? '⏹' : '🎤'}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          )}

          {/* Enviar */}
          <motion.button
            onClick={() => submit()}
            disabled={isLoading || !text.trim()}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-xl bg-kimi-accent text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-kimi-accent2 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </motion.button>
        </div>
      </div>

      <p className="text-center text-kimi-muted text-xs mt-2">
        🗣 Modo conversa · 🎤 Fala única · Enter para enviar
      </p>
    </div>
  )
}
