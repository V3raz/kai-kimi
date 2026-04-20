import type { Expression } from '@/types'

export function detectExpression(text: string): Expression {
  const lower = text.toLowerCase()

  if (
    lower.includes('não sei') ||
    lower.includes('hmm') ||
    lower.includes('deixa eu pensar') ||
    lower.includes('interessante') ||
    lower.includes('analisando')
  ) return 'thinking'

  if (
    lower.includes('incrível') ||
    lower.includes('ótimo') ||
    lower.includes('perfeito') ||
    lower.includes('claro') ||
    lower.includes('com prazer') ||
    lower.includes('que legal') ||
    lower.includes('adoro')
  ) return 'happy'

  if (
    lower.includes('sério?') ||
    lower.includes('uau') ||
    lower.includes('nossa') ||
    lower.includes('não acredito') ||
    lower.includes('caramba')
  ) return 'surprised'

  return 'idle'
}
