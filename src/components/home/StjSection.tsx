import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import Eyebrow from '@/components/Eyebrow';
import Reveal, { RevealItem } from '@/components/Reveal';

const PROOFS = [
  { title: 'Lei 8.989/1995', desc: 'isenção IPI' },
  { title: 'LC 160/2017', desc: 'autônomos incluídos' },
  { title: 'STJ REsp 2.018.676', desc: 'sem carência de profissão' },
];

/** S6 — STJ: "Nunca foi taxista? Agora pode." */
export default function StjSection() {
  return (
    <section className="bg-bg-base py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
          viewport={{ once: true, margin: '-25% 0px' }}
          transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          className="overflow-hidden rounded-2xl border border-taxi-yellow/30"
        >
          <img
            src="/stj-illustration.png"
            alt="Ilustração de martelo de juiz e balança da justiça em traço amarelo"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <Reveal>
          <RevealItem>
            <Eyebrow>Notícia boa — STJ, nov/2025</Eyebrow>
          </RevealItem>
          <RevealItem>
            <h2 className="mt-5 font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
              Não precisa ter sido taxista antes de comprar.
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mt-5 max-w-lg leading-relaxed text-text-muted">
              O STJ decidiu (REsp 2.018.676, tema repetitivo): para a isenção de IPI basta ter o{' '}
              <strong className="text-text-primary">alvará municipal válido</strong> — não é preciso comprovar
              exercício anterior da profissão. Tirou o alvará em SP? Você já pode comprar com desconto.
            </p>
          </RevealItem>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {PROOFS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-15% 0px' }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-border-subtle bg-bg-surface p-4"
              >
                <p className="font-mono text-sm font-bold text-taxi-yellow">{p.title}</p>
                <p className="mt-1 text-xs text-text-muted">{p.desc}</p>
              </motion.div>
            ))}
          </div>
          <RevealItem>
            <Link
              to="/guia"
              className="mt-7 inline-flex h-[52px] items-center gap-2 rounded-full border border-border-strong px-7 font-medium text-text-primary transition-colors duration-200 hover:bg-taxi-yellow/10"
            >
              Ler o guia completo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </RevealItem>
        </Reveal>
      </div>
    </section>
  );
}
