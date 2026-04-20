import type { Conversation, Message } from '@/types'
import { getTheme } from './themes'

const KEY = 'kaikimi_conversations'

function revive(raw: unknown): Conversation[] {
  if (!Array.isArray(raw)) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (raw as any[]).map(c => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: (c.messages as any[]).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
  }))
}

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? revive(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

export function saveConversations(convs: Conversation[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(convs))
}

export function createConversation(themeId = 'geral'): Conversation {
  const theme = getTheme(themeId)
  const greeting: Message = {
    id: 'init',
    role: 'assistant',
    content: theme.greeting,
    timestamp: new Date(),
  }
  return {
    id: Date.now().toString(),
    title: 'Nova conversa',
    themeId,
    messages: [greeting],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function autoTitle(conv: Conversation): string {
  const first = conv.messages.find(m => m.role === 'user')
  if (!first) return 'Nova conversa'
  return first.content.slice(0, 40) + (first.content.length > 40 ? '…' : '')
}
