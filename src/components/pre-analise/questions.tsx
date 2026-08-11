import type { ReactNode } from 'react';

export type Answers = Record<string, string>;

export interface Choice {
  value: string;
  label: string;
  hint?: string;
}

export type Block = 'SOBRE VOCÊ' | 'SOBRE O CARRO' | 'SOBRE O PLANO' | 'CONTATO';

export interface Question {
  id: string;
  block: Block;
  text: ReactNode;
  hint?: string;
  type: 'choice' | 'input';
  choices?: Choice[];
  inputKind?: 'year' | 'text' | 'whatsapp';
  /** Visibilidade condicional (ex.: pergunta 6 só se já usou benefício) */
  when?: (a: Answers) => boolean;
  /** Validação de inputs — retorna mensagem de erro ou null */
  validate?: (v: string) => string | null;
}

export function buildQuestions(hasContact: boolean): Question[] {
  const questions: Question[] = [
    // Bloco 1 — SOBRE VOCÊ
    {
      id: 'alvara',
      block: 'SOBRE VOCÊ',
      text: <>Você tem <strong className="text-taxi-yellow">alvará de taxista da Prefeitura de São Paulo</strong>?</>,
      hint: 'O alvará municipal é o documento-chave. O de SP capital é o que vale aqui.',
      type: 'choice',
      choices: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
        { value: 'tirando', label: 'Estou tirando' },
      ],
    },
    {
      id: 'alvara_nome',
      block: 'SOBRE VOCÊ',
      text: <>Seu alvará está <strong className="text-taxi-yellow">em seu nome</strong> e válido?</>,
      type: 'choice',
      choices: [
        { value: 'sim', label: 'Sim' },
        { value: 'outro', label: 'Em nome de outra pessoa' },
        { value: 'vencido', label: 'Vencido ou suspenso' },
      ],
    },
    {
      id: 'ear',
      block: 'SOBRE VOCÊ',
      text: <>Sua CNH tem <strong className="text-taxi-yellow">EAR</strong> (exerce atividade remunerada)?</>,
      hint: "Está escrito no verso da CNH, no campo 'Observações'.",
      type: 'choice',
      choices: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
        { value: 'nao_sei', label: 'Não sei' },
      ],
    },
    {
      id: 'cursos',
      block: 'SOBRE VOCÊ',
      text: <>Você já concluiu os <strong className="text-taxi-yellow">curso obrigatório</strong> (Condutax)?</>,
      type: 'choice',
      choices: [
        { value: 'todos', label: 'Sim, todos' },
        { value: 'alguns', label: 'Alguns' },
        { value: 'nenhum', label: 'Nenhum' },
      ],
    },
    {
      id: 'usou_antes',
      block: 'SOBRE VOCÊ',
      text: <>Você <strong className="text-taxi-yellow">já usou</strong> isenção de IPI ou ICMS como taxista antes?</>,
      type: 'choice',
      choices: [
        { value: 'nunca', label: 'Nunca usei' },
        { value: 'menos2', label: 'Sim, há menos de 2 anos' },
        { value: 'mais2', label: 'Sim, há mais de 2 anos' },
      ],
    },
    {
      id: 'ano_beneficio',
      block: 'SOBRE VOCÊ',
      text: <>Em que <strong className="text-taxi-yellow">ano</strong> foi o último benefício?</>,
      hint: 'A carência entre benefícios é de 2 anos.',
      type: 'input',
      inputKind: 'year',
      when: (a) => a.usou_antes === 'menos2' || a.usou_antes === 'mais2',
      validate: (v) => {
        const n = Number(v);
        if (!v || !/^\d{4}$/.test(v)) return 'Digite o ano com 4 dígitos (ex.: 2023).';
        const now = new Date().getFullYear();
        if (n < 1990 || n > now) return `Ano deve estar entre 1990 e ${now}.`;
        return null;
      },
    },
    // Bloco 2 — SOBRE O CARRO
    {
      id: 'zero_km',
      block: 'SOBRE O CARRO',
      text: <>O carro será <strong className="text-taxi-yellow">0 km</strong>, comprado em concessionária?</>,
      type: 'choice',
      choices: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
      ],
    },
    {
      id: 'quatro_portas',
      block: 'SOBRE O CARRO',
      text: <>Ele tem <strong className="text-taxi-yellow">4 portas</strong>?</>,
      type: 'choice',
      choices: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
        { value: 'indeciso', label: 'Ainda não escolhi' },
      ],
    },
    {
      id: 'motor',
      block: 'SOBRE O CARRO',
      text: <>Motor <strong className="text-taxi-yellow">até 2.0</strong>?</>,
      type: 'choice',
      choices: [
        { value: 'sim', label: 'Sim' },
        { value: 'acima', label: 'Acima de 2.0' },
        { value: 'indeciso', label: 'Ainda não escolhi' },
      ],
    },
    {
      id: 'combustivel',
      block: 'SOBRE O CARRO',
      text: <>Qual o <strong className="text-taxi-yellow">combustível</strong>?</>,
      type: 'choice',
      choices: [
        { value: 'flex', label: 'Flex' },
        { value: 'gasolina', label: 'Gasolina ou álcool' },
        { value: 'hibrido', label: 'Híbrido' },
        { value: 'eletrico', label: 'Elétrico' },
        { value: 'diesel', label: 'Diesel', hint: 'Diesel quase nunca é elegível — vamos marcar como pendência' },
      ],
    },
    {
      id: 'preco_teto',
      block: 'SOBRE O CARRO',
      text: <>Preço <strong className="text-taxi-yellow">até R$ 200 mil</strong>?</>,
      hint: 'Teto garantido até 31/12/2026.',
      type: 'choice',
      choices: [
        { value: 'ate', label: 'Sim' },
        { value: 'acima', label: 'Acima' },
        { value: 'indeciso', label: 'Ainda não escolhi' },
      ],
    },
    // Bloco 3 — SOBRE O PLANO
    {
      id: 'rodar_2anos',
      block: 'SOBRE O PLANO',
      text: <>Você vai <strong className="text-taxi-yellow">rodar como táxi</strong> com esse carro por pelo menos 2 anos?</>,
      hint: 'Vender antes de 2 anos devolve o imposto proporcional.',
      type: 'choice',
      choices: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
      ],
    },
    {
      id: 'quando',
      block: 'SOBRE O PLANO',
      text: <>Quando pretende <strong className="text-taxi-yellow">comprar</strong>?</>,
      type: 'choice',
      choices: [
        { value: '3m', label: 'Em até 3 meses' },
        { value: '6m', label: '3–6 meses' },
        { value: '12m', label: '6–12 meses' },
        { value: 'pesquisando', label: 'Só pesquisando' },
      ],
    },
    {
      id: 'ipva',
      block: 'SOBRE O PLANO',
      text: <>Tem interesse em saber da <strong className="text-taxi-yellow">isenção de IPVA</strong> também?</>,
      hint: 'Benefício estadual adicional possível — sem promessa, avaliamos caso a caso.',
      type: 'choice',
      choices: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
      ],
    },
    // Bloco 4 — CONTATO (pulado quando veio ?lead do simulador)
    {
      id: 'contato_nome',
      block: 'CONTATO',
      text: <>Seu <strong className="text-taxi-yellow">nome</strong>?</>,
      type: 'input',
      inputKind: 'text',
      when: () => !hasContact,
      validate: (v) => (v.trim().length >= 2 ? null : 'Digite seu nome.'),
    },
    {
      id: 'contato_whatsapp',
      block: 'CONTATO',
      text: <>Seu <strong className="text-taxi-yellow">WhatsApp</strong>?</>,
      hint: 'Só usamos para enviar seu resultado. Nada de spam.',
      type: 'input',
      inputKind: 'whatsapp',
      when: () => !hasContact,
      validate: (v) => (v.replace(/\D/g, '').length >= 10 ? null : 'Digite um WhatsApp válido com DDD.'),
    },
    {
      id: 'contato_indicacao',
      block: 'CONTATO',
      text: <>Quem te <strong className="text-taxi-yellow">indicou</strong>? <span className="text-text-faint">(opcional)</span></>,
      hint: 'Taxista que indica ganha — coloque o nome ou WhatsApp de quem te trouxe. Pode pular.',
      type: 'input',
      inputKind: 'text',
      validate: () => null,
    },
  ];
  return questions;
}

export function visibleQuestions(questions: Question[], answers: Answers): Question[] {
  return questions.filter((q) => !q.when || q.when(answers));
}

export interface Evaluation {
  result: 'elegivel' | 'pendencias' | 'nao_elegivel';
  score: number;
  pendencias: string[];
  motivoNaoElegivel: string | null;
}

export function evaluate(answers: Answers): Evaluation {
  const pendencias: string[] = [];
  const bloqueios: string[] = [];

  // Bloco 1 — você
  if (answers.alvara === 'nao') bloqueios.push('Sem alvará de taxista da Prefeitura de SP — ele é o documento-chave do benefício.');
  if (answers.alvara === 'tirando') pendencias.push('Alvará em andamento — o benefício só sai com o alvará emitido.');
  if (answers.alvara_nome === 'outro') bloqueios.push('Alvará em nome de outra pessoa — precisa estar no seu nome.');
  if (answers.alvara_nome === 'vencido') pendencias.push('Alvará vencido ou suspenso — regularize na Prefeitura de SP.');
  if (answers.ear === 'nao') pendencias.push('CNH sem EAR — resolver no Detran-SP.');
  if (answers.ear === 'nao_sei') pendencias.push('Confirmar EAR no verso da CNH (campo "Observações").');
  if (answers.cursos === 'alguns') pendencias.push('Curso obrigatório pendente — conclua o Condutax.');
  if (answers.cursos === 'nenhum') pendencias.push('Curso obrigatório pendente — Condutax.');
  if (answers.usou_antes === 'menos2') {
    const ano = Number(answers.ano_beneficio);
    if (ano && !Number.isNaN(ano)) {
      pendencias.push(`Carência: último benefício em ${ano} → libera em ${ano + 2}.`);
    } else {
      pendencias.push('Carência de 2 anos entre benefícios — vamos confirmar a data do último.');
    }
  }

  // Bloco 2 — carro
  if (answers.zero_km === 'nao') bloqueios.push('A isenção vale só para carro 0 km comprado em concessionária.');
  if (answers.quatro_portas === 'nao') pendencias.push('O carro precisa ter 4 portas — ajuste a escolha do modelo.');
  if (answers.motor === 'acima') pendencias.push('Motor precisa ser até 2.0 — ajuste a escolha do modelo.');
  if (answers.combustivel === 'diesel') bloqueios.push('Diesel quase nunca é elegível para a isenção de táxi.');
  if (answers.preco_teto === 'acima') bloqueios.push('Acima do teto de R$ 200 mil, a isenção não se aplica.');

  // Bloco 3 — plano
  if (answers.rodar_2anos === 'nao') bloqueios.push('É preciso rodar como táxi por pelo menos 2 anos — vender antes devolve o imposto.');

  const result: Evaluation['result'] =
    bloqueios.length > 0 ? 'nao_elegivel' : pendencias.length > 0 ? 'pendencias' : 'elegivel';

  // Score: proporção de respostas "positivas"
  const positive: Record<string, string[]> = {
    alvara: ['sim'],
    alvara_nome: ['sim'],
    ear: ['sim'],
    cursos: ['todos'],
    usou_antes: ['nunca', 'mais2'],
    zero_km: ['sim'],
    quatro_portas: ['sim', 'indeciso'],
    motor: ['sim', 'indeciso'],
    combustivel: ['flex', 'gasolina', 'hibrido', 'eletrico'],
    preco_teto: ['ate', 'indeciso'],
    rodar_2anos: ['sim'],
  };
  let hits = 0;
  let total = 0;
  for (const [key, ok] of Object.entries(positive)) {
    if (answers[key] !== undefined) {
      total += 1;
      if (ok.includes(answers[key])) hits += 1;
    }
  }
  const score = total ? Math.round((hits / total) * 100) : 0;

  return { result, score, pendencias, motivoNaoElegivel: bloqueios[0] ?? null };
}

export interface StoredContact {
  name: string;
  whatsapp: string;
  leadId?: number;
}

export function loadContact(): StoredContact | null {
  try {
    const raw = JSON.parse(localStorage.getItem('itx_contact') ?? 'null');
    if (raw?.name && raw?.whatsapp) return raw as StoredContact;
  } catch {
    /* ignora */
  }
  return null;
}
