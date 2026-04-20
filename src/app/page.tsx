'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import MessageList from '@/components/MessageList'
import ChatInput from '@/components/ChatInput'
import Sidebar from '@/components/Sidebar'
import { detectExpression } from '@/lib/expression'
import { speak, stopSpeaking } from '@/lib/tts'
import { getTheme } from '@/lib/themes'
import {
  loadConversations, saveConversations,
  createConversation,
} from '@/lib/storage'
import type { Conversation, Expression, Message } from '@/types'

const Avatar    = dynamic(() => import('@/components/Avatar'),    { ssr: false })
const KaiAvatar = dynamic(() => import('@/components/KaiAvatar'), { ssr: false })

type GeminiMsg = { role: 'user' | 'model'; parts: { text: string }[] }

function toGemini(messages: Message[]): GeminiMsg[] {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeChar, setActiveChar] = useState<'kimi' | 'kai'>('kimi')
  const [isLoading, setIsLoading] = useState(false)
  const [expression, setExpression] = useState<Expression>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [conversationMode, setConversationMode] = useState(false)
  const [triggerAutoListen, setTriggerAutoListen] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // Inicializa conversas do localStorage
  useEffect(() => {
    const saved = loadConversations()
    if (saved.length > 0) {
      setConversations(saved)
      setActiveId(saved[0].id)
    } else {
      const first = createConversation('geral')
      setConversations([first])
      setActiveId(first.id)
    }
  }, [])

  // Persiste ao mudar
  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations)
  }, [conversations])

  const activeConv = conversations.find(c => c.id === activeId)
  const messages = activeConv?.messages ?? []

  const updateConv = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => c.id === id ? updater(c) : c))
  }, [])

  const handleNewConv = useCallback((themeId: string) => {
    const conv = createConversation(themeId)
    setConversations(prev => [conv, ...prev])
    setActiveId(conv.id)
    setSidebarOpen(false)
    stopSpeaking()
    setIsSpeaking(false)
    setIsLoading(false)
    setExpression('idle')
  }, [])

  const handleDeleteConv = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id)
      if (next.length === 0) {
        const fresh = createConversation('geral')
        setActiveId(fresh.id)
        return [fresh]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }, [activeId])

  const sendMessage = useCallback(async (text: string) => {
    if (isLoading || !activeId) return

    const conv = conversations.find(c => c.id === activeId)
    if (!conv) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    updateConv(activeId, c => ({
      ...c,
      messages: [...c.messages, userMsg, assistantMsg],
      updatedAt: new Date(),
    }))

    setIsLoading(true)
    setExpression('processing')
    stopSpeaking()
    setIsSpeaking(false)
    abortRef.current = new AbortController()

    try {
      const theme = getTheme(conv.themeId)
      const history = toGemini([...conv.messages, userMsg])

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, systemExtra: theme.systemExtra }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('Erro')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      setExpression('thinking')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        updateConv(activeId, c => ({
          ...c,
          messages: c.messages.map(m => m.id === assistantId ? { ...m, content: fullText } : m),
        }))
      }

      const expr = detectExpression(fullText)
      setExpression(expr)

      if (ttsEnabled && fullText) {
        setIsSpeaking(true)
        setExpression('talking')
        speak(fullText, () => {
          setIsSpeaking(false)
          setExpression('idle')
          if (conversationMode) setTriggerAutoListen(n => n + 1)
        })
      } else {
        setExpression('idle')
        if (conversationMode) setTriggerAutoListen(n => n + 1)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      updateConv(activeId, c => ({
        ...c,
        messages: c.messages.map(m =>
          m.id === assistantId ? { ...m, content: 'Algo deu errado. Pode tentar de novo?' } : m
        ),
      }))
      setExpression('idle')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, activeId, conversations, updateConv, ttsEnabled, conversationMode])

  const handleStop = () => {
    abortRef.current?.abort()
    stopSpeaking()
    setIsSpeaking(false)
    setIsLoading(false)
    setExpression('idle')
  }

  const theme = activeConv ? getTheme(activeConv.themeId) : null

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNewConv}
        onDelete={handleDeleteConv}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Avatar panel */}
      <div className="hidden md:flex w-[300px] flex-col items-center justify-center border-r border-kimi-border bg-kimi-bg/60 backdrop-blur-sm relative shrink-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-kimi-accent"
              style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [0, -18, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>

        {activeChar === 'kimi' ? (
          <Avatar expression={expression} isSpeaking={isSpeaking} isListening={isListening} />
        ) : (
          <KaiAvatar expression={expression} isSpeaking={isSpeaking} isListening={isListening} />
        )}

        {/* Toggle Kai/Kimi */}
        <div className="flex rounded-full border border-kimi-border overflow-hidden text-xs mt-2">
          {(['kimi', 'kai'] as const).map(char => (
            <button
              key={char}
              onClick={() => setActiveChar(char)}
              className={`px-4 py-1.5 transition-colors ${
                activeChar === char ? 'bg-kimi-accent text-white' : 'text-kimi-muted hover:text-kimi-text'
              }`}
            >
              {char === 'kimi' ? '🌸 Kimi' : '⚡ Kai'}
            </button>
          ))}
        </div>

        <div className="mt-3 text-center">
          <h2 className="text-sm font-semibold text-kimi-text">
            {activeChar === 'kimi' ? 'Kimi' : 'Kai'}
          </h2>
          <p className="text-xs text-kimi-muted mt-0.5">
            {isListening ? '🎤 Ouvindo...' : isLoading ? '✨ Pensando...' : isSpeaking ? '💬 Falando...' : 'Online'}
          </p>
        </div>

        <button
          onClick={() => { setTtsEnabled(v => !v); if (isSpeaking) { stopSpeaking(); setIsSpeaking(false) } }}
          className={`mt-3 px-3 py-1 rounded-full text-xs border transition-colors ${
            ttsEnabled ? 'border-kimi-accent text-kimi-accent bg-kimi-accent/10' : 'border-kimi-border text-kimi-muted'
          }`}
        >
          {ttsEnabled ? '🔊 Voz ativa' : '🔇 Voz off'}
        </button>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-kimi-border bg-kimi-bg/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-kimi-muted hover:text-kimi-text hover:bg-kimi-surface transition-colors"
              title="Conversas"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* Avatar mobile */}
            <div className="md:hidden w-7 h-7 rounded-full bg-kimi-accent flex items-center justify-center text-white text-xs font-bold">
              {activeChar === 'kimi' ? 'K' : 'K'}
            </div>

            <div>
              <span className="font-semibold text-kimi-text text-sm">
                {theme ? `${theme.emoji} ${theme.label}` : 'Kai & Kimi'}
              </span>
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
        <MessageList
          messages={messages}
          isLoading={isLoading && messages[messages.length - 1]?.content === ''}
        />

        {/* Input */}
        <div className="shrink-0 border-t border-kimi-border bg-kimi-bg/80 backdrop-blur-sm">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            isListening={isListening}
            onListeningChange={setIsListening}
            conversationMode={conversationMode}
            onConversationModeChange={setConversationMode}
            triggerAutoListen={triggerAutoListen}
          />
        </div>
      </div>
    </main>
  )
}
