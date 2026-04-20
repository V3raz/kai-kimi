export type Expression = 'idle' | 'talking' | 'thinking' | 'happy' | 'surprised' | 'processing'

export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  timestamp: Date
}

export interface Theme {
  id: string
  label: string
  emoji: string
  description: string
  systemExtra: string
  greeting: string
}

export interface Conversation {
  id: string
  title: string
  themeId: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}
