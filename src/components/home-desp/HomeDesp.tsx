import { Link } from 'react-router';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  FileCheck2,
  KanbanSquare,
  MessageCircle,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';

const WA_DEMO = 'https://wa.me/5511942299144?text=Quero%20ver%20a%20demo%20do%20Despacha.Ai';

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-taxi-yellow">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-tight text-text-primary md:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-text-muted">{sub}</p>}
    </div>
  );
}

function HeroDesp() {
  return (
    <section className="relative overflow-hidden bg-bg-base">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            <span className="h-2 w-2 rounded-full bg-taxi-yellow" aria-hidden="true" />
            Para despachantes · vertical Táxi ativo · PCD em breve
          </p>
          <h1 className="mt-6 font-display text-4xl uppercase leading-[1.05] text-text-primary md:text-6xl">
            A plataforma do <span className="text-taxi-yellow">despachante</span> de isenções
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-muted">
            Chega de gerenciar processo de isenção no WhatsApp e em planilha. O Despacha.Ai organiza
            clientes, documentos, etapas e cobrança em um painel único — e dá ao seu cliente um
            portal para acompanhar tudo sozinho.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={WA_DEMO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-taxi-yellow px-8 text-base font-bold text-bg-base transition-transform hover:scale-[1.02]"
            >
              Agendar demonstração <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <Link
              to="/#plataforma"
              className="inline-flex h-12 items-center rounded-md border border-border-subtle px-8 text-base font-semibold text-text-primary transition-colors hover:border-taxi-yellow"
            >
              Ver a plataforma
            </Link>
          </div>
        </div>
      </div>
      <div className="zebra h-2 w-full" aria-hidden="true" />
    </section>
  );
}

function PainPoints() {
  const pains = [
    'Documento do cliente perdido no meio de 40 conversas de WhatsApp',
    'Você não lembra em qual etapa está cada processo sem abrir a planilha',
    'Cliente liga todo dia perguntando "e aí, saiu?"',
    'Cobrança no boca a boca — e o processo andando sem você ter recebido',
  ];
  const gains = [
    'Todos os documentos anexados ao processo, com aprovação/rejeição em 1 clique',
    'Kanban por etapa: DTP, DETRAN, SISEN, SIVEI — visão de todos os clientes',
    'Portal do cliente com status em tempo real — ele se serve sozinho',
    'Trava de pagamento: o processo não avança enquanto a guia paga não constar',
  ];
  return (
    <section className="bg-bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionTitle
          kicker="O problema"
          title="Do caos do WhatsApp para um painel só"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border-subtle bg-bg-base p-7">
            <h3 className="font-display text-lg uppercase text-text-primary">Hoje, sem o Despacha.Ai</h3>
            <ul className="mt-5 space-y-4">
              {pains.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-text-muted">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-taxi-yellow/40 bg-bg-base p-7">
            <h3 className="font-display text-lg uppercase text-taxi-yellow">Com o Despacha.Ai</h3>
            <ul className="mt-5 space-y-4">
              {gains.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-text-muted">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-taxi-yellow" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Platform() {
  const feats = [
    {
      icon: KanbanSquare,
      title: 'Pipeline por etapa',
      desc: 'Cadastro, documentos, DTP, DETRAN, SISEN, SIVEI, pós-compra e IPVA — cada cliente no lugar certo, com checklist próprio por etapa.',
    },
    {
      icon: FileCheck2,
      title: 'Revisão de documentos',
      desc: 'Cliente sobe pelo portal, você aprova ou rejeita com motivo. Ele é avisado automaticamente por e-mail.',
    },
    {
      icon: Wallet,
      title: 'Cobrança com trava',
      desc: 'Marque o pagamento como confirmado e destrave as etapas finais. Processo não anda sem o despachante receber.',
    },
    {
      icon: BellRing,
      title: 'Lembretes automáticos',
      desc: 'IPVA 0 km (30 dias) e licenciamento do ano: a plataforma avisa o cliente por e-mail no prazo certo.',
    },
    {
      icon: Users,
      title: 'CRM de leads e indicações',
      desc: 'Capture leads da pré-análise, acompanhe conversão e registre quem indicou quem.',
    },
    {
      icon: ShieldCheck,
      title: 'Portal do cliente com login',
      desc: 'Cada cliente acompanha o próprio processo, envia documentos e vê o que falta — sem ligar para você.',
    },
  ];
  return (
    <section id="plataforma" className="bg-bg-base py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionTitle
          kicker="A plataforma"
          title="Tudo que o seu escritório usa, em um sistema"
          sub="Feito para a rotina real do despachante de isenções — não é um CRM genérico adaptado."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((f) => (
            <div key={f.title} className="rounded-xl border border-border-subtle bg-bg-surface p-6">
              <f.icon className="h-7 w-7 text-taxi-yellow" aria-hidden="true" />
              <h3 className="mt-4 font-display text-base uppercase text-text-primary">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '1', title: 'Cadastre o cliente', desc: 'Ou ele mesmo se cadastra pelo link do seu escritório e faz a pré-análise de elegibilidade.' },
    { n: '2', title: 'Ele envia os documentos', desc: 'O portal mostra o checklist exato do que falta. Você revisa e aprova com um clique.' },
    { n: '3', title: 'Acompanhe o pipeline', desc: 'Mova o processo pelas etapas. A trava de pagamento garante que nada avança de graça.' },
    { n: '4', title: 'Cliente acompanha sozinho', desc: 'Status em tempo real e lembretes automáticos de IPVA e licenciamento. Menos ligação, mais processo.' },
  ];
  return (
    <section id="como-funciona" className="bg-bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionTitle kicker="Como funciona" title="Do cadastro à isenção, em 4 movimentos" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border-subtle bg-bg-base p-6">
              <span className="font-display text-4xl text-taxi-yellow">{s.n}</span>
              <h3 className="mt-3 font-display text-base uppercase text-text-primary">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: 'Solo',
      price: 'R$ 197',
      period: '/mês',
      items: ['1 usuário (você)', 'Clientes e processos ilimitados', 'Portal do cliente', 'Lembretes automáticos'],
      highlight: false,
    },
    {
      name: 'Escritório',
      price: 'R$ 497',
      period: '/mês',
      items: ['Até 5 usuários', 'Sua marca no portal (white-label)', 'Relatórios de conversão', 'Suporte prioritário no WhatsApp'],
      highlight: true,
    },
  ];
  return (
    <section id="planos" className="bg-bg-base py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <SectionTitle
          kicker="Planos"
          title="Preço de despachante, não de software gringo"
          sub="Sem taxa por processo, sem fidelidade. Cancele quando quiser."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl border p-7 ${
                p.highlight ? 'border-taxi-yellow bg-bg-surface' : 'border-border-subtle bg-bg-surface'
              }`}
            >
              <h3 className="font-display text-lg uppercase text-text-primary">{p.name}</h3>
              <p className="mt-3">
                <span className="font-display text-4xl text-taxi-yellow">{p.price}</span>
                <span className="text-sm text-text-muted">{p.period}</span>
              </p>
              <ul className="mt-5 space-y-3">
                {p.items.map((i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-taxi-yellow" aria-hidden="true" />
                    {i}
                  </li>
                ))}
              </ul>
              <a
                href={WA_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-bold transition-transform hover:scale-[1.01] ${
                  p.highlight
                    ? 'bg-taxi-yellow text-bg-base'
                    : 'border border-border-subtle text-text-primary hover:border-taxi-yellow'
                }`}
              >
                Começar agora
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    {
      q: 'Meus clientes precisam de computador?',
      a: 'Não. O portal do cliente funciona no celular: ele tira foto do documento e envia direto pelo navegador.',
    },
    {
      q: 'O sistema paga as guias pelo cliente?',
      a: 'Não — o Despacha.Ai é a camada de organização do seu escritório. As guias (DTP, taxas DETRAN etc.) continuam sendo pagas pelo cliente, e o comprovante de guia paga sobe no portal para destravar o processo.',
    },
    {
      q: 'Posso usar com a minha marca?',
      a: 'Sim, no plano Escritório o portal do cliente sai com o nome e as cores do seu escritório (white-label).',
    },
    {
      q: 'E quando sair o vertical PCD?',
      a: 'A mesma plataforma vai atender isenções para PCD (IPI, ICMS, IPVA conforme o estado). Clientes do plano ativo terão acesso sem custo adicional no lançamento.',
    },
    {
      q: 'Meus dados ficam seguros?',
      a: 'Sim. Servidor próprio, backups diários e acesso por usuário/senha. Seus dados e dos seus clientes não são compartilhados.',
    },
  ];
  return (
    <section id="faq" className="bg-bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <SectionTitle kicker="FAQ" title="Perguntas de quem despacha" />
        <div className="mt-10 space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-xl border border-border-subtle bg-bg-base p-5">
              <summary className="cursor-pointer list-none font-semibold text-text-primary">
                {f.q}
                <span className="float-right text-taxi-yellow transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaDesp() {
  return (
    <section className="relative bg-bg-base py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <h2 className="font-display text-3xl uppercase leading-tight text-text-primary md:text-4xl">
          Veja rodando com dados de verdade<span className="text-taxi-yellow">*</span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-text-muted">
          *Dados fictícios de demonstração — mas o sistema é o de produção. Em 15 minutos no
          WhatsApp a gente mostra o painel, o pipeline e o portal do cliente.
        </p>
        <a
          href={WA_DEMO}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-taxi-yellow px-8 text-base font-bold text-bg-base transition-transform hover:scale-[1.02]"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> Quero ver a demo
        </a>
      </div>
    </section>
  );
}

export default function HomeDesp() {
  return (
    <>
      <HeroDesp />
      <PainPoints />
      <Platform />
      <HowItWorks />
      <Pricing />
      <Faq />
      <FinalCtaDesp />
    </>
  );
}
