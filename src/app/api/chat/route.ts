import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as {
      messages: { role: 'user' | 'model'; parts: { text: string }[] }[]
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ googleSearch: {} } as any],
      systemInstruction: SYSTEM_PROMPT,
    })

    const chat = model.startChat({
      history: messages.slice(0, -1),
    })

    const lastMessage = messages[messages.length - 1]
    const stream = await chat.sendMessageStream(lastMessage.parts[0].text)

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text = chunk.text()
            if (text) controller.enqueue(encoder.encode(text))
          }
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
    console.error('[chat/route]', err)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
