let currentUtterance: SpeechSynthesisUtterance | null = null

export function speak(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()

  const cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[EXPRESSION:\w+\]/g, '')
    .trim()

  currentUtterance = new SpeechSynthesisUtterance(cleaned)
  currentUtterance.lang = 'pt-BR'
  currentUtterance.rate = 1.05
  currentUtterance.pitch = 1.1
  currentUtterance.volume = 1

  const voices = window.speechSynthesis.getVoices()
  const ptVoice = voices.find(
    (v) => v.lang.startsWith('pt') && v.name.toLowerCase().includes('female')
  ) ?? voices.find((v) => v.lang.startsWith('pt'))
  if (ptVoice) currentUtterance.voice = ptVoice

  if (onEnd) currentUtterance.onend = onEnd
  window.speechSynthesis.speak(currentUtterance)
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  currentUtterance = null
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined') return false
  return window.speechSynthesis.speaking
}
