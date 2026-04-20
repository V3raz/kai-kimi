import type { Theme } from '@/types'

export const THEMES: Theme[] = [
  {
    id: 'geral',
    label: 'Chat Livre',
    emoji: '💬',
    description: 'Conversa geral sobre qualquer assunto',
    systemExtra: '',
    greeting: 'Oi! Pode falar à vontade — pergunta, conversa, o que quiser. Como posso ajudar?',
  },
  {
    id: 'code',
    label: 'Programação',
    emoji: '💻',
    description: 'Código, debug, arquitetura e tech',
    systemExtra: 'Foco em programação. Responda com exemplos de código quando relevante. Seja precisa com sintaxe e boas práticas.',
    greeting: 'Modo programação ativo 💻 Pode mandar o código, erro, ou descrever o que quer construir.',
  },
  {
    id: 'pesquisa',
    label: 'Pesquisa',
    emoji: '🔍',
    description: 'Pesquisa aprofundada com fontes',
    systemExtra: 'Foco em pesquisa detalhada. Use a ferramenta de busca sempre que possível. Organize as informações de forma clara.',
    greeting: 'Pronta para pesquisar 🔍 Qual assunto quer que eu investigue?',
  },
  {
    id: 'negocios',
    label: 'Negócios',
    emoji: '📊',
    description: 'Estratégia, análise e empreendedorismo',
    systemExtra: 'Foco em negócios, estratégia e empreendedorismo. Seja analítica, use dados quando disponíveis.',
    greeting: 'Modo negócios 📊 Pode falar sobre estratégia, análise de mercado, decisões — estou aqui.',
  },
  {
    id: 'criativo',
    label: 'Criatividade',
    emoji: '✨',
    description: 'Ideias, brainstorming e criação',
    systemExtra: 'Foco em criatividade e ideias. Seja expansiva, sugira possibilidades inesperadas, pense fora da caixa.',
    greeting: 'Vamos criar coisas incríveis ✨ Me conta a ideia — mesmo que seja só um esboço.',
  },
  {
    id: 'jarvis',
    label: 'Modo Jarvis',
    emoji: '🤖',
    description: 'Assistente executivo — foco total em tarefas',
    systemExtra: 'Modo assistente executivo. Seja direta e eficiente. Foco em resultados, listas de ações e execução.',
    greeting: 'Modo Jarvis ativo 🤖 Me passa a tarefa e eu resolvo.',
  },
]

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}
