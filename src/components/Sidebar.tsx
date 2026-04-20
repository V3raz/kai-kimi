'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Conversation } from '@/types'
import { THEMES } from '@/lib/themes'
import { autoTitle } from '@/lib/storage'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
  onNew: (themeId: string) => void
  onDelete: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, isOpen, onClose }: SidebarProps) {
  const [showThemes, setShowThemes] = useState(false)

  const sorted = [...conversations].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  return (
    <>
      {/* Overlay mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed md:relative top-0 left-0 h-full z-40 md:z-auto flex flex-col bg-kimi-bg border-r border-kimi-border overflow-hidden"
        animate={{ width: isOpen ? 256 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{ minWidth: 0 }}
      >
        <div className="flex flex-col h-full w-64 min-w-[256px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-kimi-border shrink-0">
            <span className="text-sm font-semibold text-kimi-text">Conversas</span>
            <button onClick={onClose} className="text-kimi-muted hover:text-kimi-text text-lg leading-none">×</button>
          </div>

          {/* Nova Conversa */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <button
              onClick={() => setShowThemes(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-kimi-accent/15 border border-kimi-accent/30 text-kimi-accent text-sm font-medium hover:bg-kimi-accent/25 transition-colors"
            >
              <span className="text-base">+</span>
              Nova conversa
              <span className="ml-auto text-xs opacity-60">{showThemes ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Tema picker */}
          <AnimatePresence>
            {showThemes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-3 pb-2 shrink-0"
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => { onNew(theme.id); setShowThemes(false) }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-kimi-surface border border-kimi-border hover:border-kimi-accent/50 text-left transition-colors"
                    >
                      <span className="text-base">{theme.emoji}</span>
                      <span className="text-xs text-kimi-text truncate">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lista de conversas */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
            {sorted.length === 0 && (
              <p className="text-xs text-kimi-muted text-center mt-8 px-2">Nenhuma conversa ainda</p>
            )}
            {sorted.map(conv => {
              const theme = THEMES.find(t => t.id === conv.themeId)
              const isActive = conv.id === activeId
              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-kimi-accent/15 border border-kimi-accent/30'
                      : 'hover:bg-kimi-surface border border-transparent'
                  }`}
                  onClick={() => { onSelect(conv.id); onClose() }}
                >
                  <span className="text-base shrink-0 mt-0.5">{theme?.emoji ?? '💬'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-kimi-text truncate leading-snug">
                      {autoTitle(conv)}
                    </p>
                    <p className="text-[10px] text-kimi-muted mt-0.5">{timeAgo(conv.updatedAt)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-kimi-muted hover:text-red-400 transition-all text-xs px-1"
                    title="Apagar"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </motion.aside>
    </>
  )
}
