'use client'

import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import MessageList from '@/components/MessageList'
import ChatInput from '@/components/ChatInput'
import { detectExpression } from '@/lib/expression'
import { speak, stopSpeaking } from '@/lib/tts'
import type { Message, Expression } from '@/types'

const Avatar    = dynamic(() => import('@/components/Avatar'),    { ssr: false })
const KaiAvatar = dynamic(() => import('@/components/KaiAvatar'), { ssr: false })

type GeminiMessage = {
  role: 'user' | 'model'
  parts: { text: string }[]
}

function toGeminiHistory(messages: Message[]): GeminiMessage[] {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

export default function Home() {
  const [activeChar, setActiveChar] = useState<'kimi' | 'kai'>('kimi')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Oi! Eu sou a Kimi 🌸 Pode me perguntar qualquer coisa, pedir pra pesquisar na web, criar código, analisar problemas — ou só conversar. Como posso ajudar?',
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [expression, setExpression] = useState<Expression>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    if (isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    setExpression('processing')
    stopSpeaking()
    setIsSpeaking(false)

    const assistantId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
    ])

    abortRef.current = new AbortController()

    try {
      const history = toGeminiHistory([...messages, userMsg])

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('Erro na resposta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      setExpression('thinking')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
        )
      }

      const detectedExpr = detectExpression(fullText)
      setExpression(detectedExpr)

      if (ttsEnabled && fullText) {
        setIsSpeaking(true)
        setExpression('talking')
        speak(fullText, () => {
          setIsSpeaking(false)
          setExpression('idle')
        })
      } else {
        setTimeout(() => setExpression('idle'), 2000)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error(err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Ops, algo deu errado. Pode tentar de novo?' }
            : m
        )
      )
      setExpression('idle')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages, ttsEnabled])

  const handleStop = () => {
    abortRef.current?.abort()
    stopSpeaking()
    setIsSpeaking(false)
    setIsLoading(false)
    setExpression('idle')
  }

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Painel do avatar — esquerda */}
      <div className="hidden md:flex w-[340px] flex-col items-center justify-center border-r border-kimi-border bg-kimi-bg/60 backdrop-blur-sm relative shrink-0">
        {/* Partículas de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-kimi-accent"
              style={{
                left: `${15 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.4,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {activeChar === 'kimi' ? (
          <Avatar expression={expression} isSpeaking={isSpeaking} isListening={isListening} />
        ) : (
          <KaiAvatar expression={expression} isSpeaking={isSpeaking} isListening={isListening} />
        )}

        {/* Toggle Kai / Kimi */}
        <div className="flex rounded-full border border-kimi-border overflow-hidden text-xs mb-2">
          {(['kimi', 'kai'] as const).map((char) => (
            <button
              key={char}
              onClick={() => setActiveChar(char)}
              className={`px-4 py-1.5 capitalize transition-colors ${
                activeChar === char
                  ? 'bg-kimi-accent text-white'
                  : 'text-kimi-muted hover:text-kimi-text'
              }`}
            >
              {char === 'kimi' ? '🌸 Kimi' : '⚡ Kai'}
            </button>
          ))}
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold text-kimi-text">
            {activeChar === 'kimi' ? 'Kimi' : 'Kai'}
          </h2>
          <p className="text-xs text-kimi-muted mt-0.5">
            {isListening   ? '🎤 Ouvindo...' :
             isLoading     ? '✨ Pensando...' :
             isSpeaking    ? '💬 Falando...' :
             'Online'}
          </p>
        </div>

        {/* Toggle de voz */}
        <button
          onClick={() => {
            setTtsEnabled((v) => !v)
            if (isSpeaking) { stopSpeaking(); setIsSpeaking(false) }
          }}
          className={`mt-4 px-4 py-1.5 rounded-full text-xs border transition-colors ${
            ttsEnabled
              ? 'border-kimi-accent text-kimi-accent bg-kimi-accent/10'
              : 'border-kimi-border text-kimi-muted'
          }`}
        >
          {ttsEnabled ? '🔊 Voz ativa' : '🔇 Voz desativada'}
        </button>
      </div>

      {/* Painel do chat — direita */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-kimi-border bg-kimi-bg/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar mobile */}
            <div className="md:hidden">
              <div className="w-8 h-8 rounded-full bg-kimi-accent flex items-center justify-center text-white text-sm">
                K
              </div>
            </div>
            <div>
              <span className="font-semibold text-kimi-text">Kai & Kimi</span>
              <span className="text-xs text-kimi-muted ml-2">Assistente Pessoal de IA</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoading && (
              <motion.button
                onClick={handleStop}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs px-3 py-1 rounded-full border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Parar
              </motion.button>
            )}
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>

        {/* Mensagens */}
        <MessageList messages={messages} isLoading={isLoading && messages[messages.length - 1]?.content === ''} />

        {/* Input */}
        <div className="shrink-0 border-t border-kimi-border bg-kimi-bg/80 backdrop-blur-sm">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            isListening={isListening}
            onListeningChange={setIsListening}
          />
        </div>
      </div>
    </main>
  )
}
