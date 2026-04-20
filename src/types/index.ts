export type Expression = 'idle' | 'talking' | 'thinking' | 'happy' | 'surprised' | 'processing'

export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  timestamp: Date
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  expression: Expression
  isSpeaking: boolean
  isListening: boolean
}
