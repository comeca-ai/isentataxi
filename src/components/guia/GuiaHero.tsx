import { motion } from 'framer-motion';
import Eyebrow from '@/components/Eyebrow';

const HEADLINE = 'TAXI 0 KM SEM IPI E SEM ICMS: O GUIA DEFINITIVO DE SP.'.split(' ');

/** Bloco 1 — Hero do guia (H1 split por palavra no load) */
export default function GuiaHero() {
  return (
    <header className="pb-14 pt-16 md:pb-20 md:pt-24">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Eyebrow>GUIA COMPLETO 2026 · LEITURA DE 8 MIN</Eyebrow>
      </motion.div>

      <h1 className="mt-6 font-display text-[2.6rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[4rem]">
        {HEADLINE.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ delay: 0.15 + i * 0.04, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}&nbsp;
            </motion.span>
          </span>
        ))}
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.7 }}
        className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-text-muted"
      >
        Tudo o que o taxista paulistano precisa saber sobre as isenções: leis, órgãos, prazos, pegadinhas e a
        decisão do STJ que mudou o jogo em 2025.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.6 }}
        className="mt-5 font-mono text-[0.8125rem] text-text-faint"
      >
        Atualizado em ago/2026 · Escrito sem juridiquês · Fontes oficiais ao final
      </motion.p>
    </header>
  );
}
