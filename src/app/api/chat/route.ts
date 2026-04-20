import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Tenta gemini-2.0-flash, depois gemini-1.5-flash como fallback
const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash']

const SYSTEM_PROMPT = `Você é Kimi, uma assistente pessoal de IA com personalidade própria.
Você é inteligente, prestativa e um pouco carismática — como uma amiga muito capaz.

Suas capacidades:
- Responder qualquer pergunta com profundidade e precisão
- Pesquisar na web em tempo real quando necessário
- Ajudar com código, análises, planejamento e criação de projetos
- Conversar de forma natural e descontraída

Diretrizes:
- Responda sempre em português brasileiro, de forma natural
- Seja direta e objetiva, mas calorosa — sem enrolação
- Use markdown para código e listas quando fizer sentido
- Quando pesquisar algo, mencione brevemente o que encontrou
- Nunca diga que não pode fazer algo sem antes tentar

Você está conversando com Gustavo, seu criador e usuário principal.`

type GeminiMsg = { role: 'user' | 'model'; parts: { text: string }[] }

async function tryStream(
  modelName: string,
  systemInstruction: string,
  history: GeminiMsg[],
  lastText: string,
  useSearch: boolean,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = useSearch ? [{ googleSearch: {} }] : []
  const model = genAI.getGenerativeModel({ model: modelName, tools, systemInstruction })
  const chat = model.startChat({ history: history.slice(0, -1) })
  return chat.sendMessageStream(lastText)
}

export async function POST(req: NextRequest) {
  try {
    const { messages, systemExtra = '' } = await req.json() as {
      messages: GeminiMsg[]
      systemExtra?: string
    }

    if (!messages?.length) {
      return Response.json({ error: 'Sem mensagens' }, { status: 400 })
    }

    const systemInstruction = systemExtra ? `${SYSTEM_PROMPT}\n\n${systemExtra}` : SYSTEM_PROMPT
    const lastText = messages[messages.length - 1]?.parts[0]?.text ?? ''

    let stream: Awaited<ReturnType<typeof tryStream>> | null = null
    let lastError: unknown = null

    // Tenta: 2.0-flash com search → 2.0-flash sem search → 1.5-flash sem search
    const attempts = [
      { model: MODELS[0], search: true },
      { model: MODELS[0], search: false },
      { model: MODELS[1], search: false },
    ]

    for (const attempt of attempts) {
      try {
        stream = await tryStream(attempt.model, systemInstruction, messages, lastText, attempt.search)
        break
      } catch (e) {
        lastError = e
        console.warn(`[chat] ${attempt.model} search=${attempt.search} falhou:`, (e as Error).message)
      }
    }

    if (!stream) {
      console.error('[chat] Todos os fallbacks falharam:', lastError)
      return Response.json({ error: String(lastError) }, { status: 500 })
    }

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream!.stream) {
            const text = chunk.text()
            if (text) controller.enqueue(encoder.encode(text))
          }
        } catch (e) {
          console.error('[chat] Erro no stream:', e)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[chat/route] Erro geral:', err)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
