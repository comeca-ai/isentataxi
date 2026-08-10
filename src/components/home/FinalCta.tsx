import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight, MessageCircle } from 'lucide-react';

const HEADLINE = ['O', 'desconto', 'tá', 'na', 'lei.', 'A', 'corrida', 'é', 'sua.'];

/** S11 — CTA final */
export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-bg-base py-32">
      <motion.div
        className="hero-glow absolute inset-0"
        animate={{ opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-4xl px-5 text-center md:px-8">
        <h2 className="font-display text-[2.6rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[5rem]">
          {HEADLINE.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: '110%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true, margin: '-20% 0px' }}
                transition={{ delay: i * 0.04, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {word}&nbsp;
              </motion.span>
            </span>
          ))}
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mx-auto mt-6 max-w-xl text-lg text-text-muted"
        >
          Simule grátis agora e descubra em 2 minutos se você pode economizar até R$ 45 mil no seu próximo
          táxi 0 km.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to="/simulador"
            className="group flex h-[52px] items-center gap-2 rounded-full bg-taxi-yellow px-8 font-bold text-bg-base transition-all duration-200 hover:scale-[1.03] hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
          >
            Simular grátis
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            to="/pre-analise"
            className="flex h-[52px] items-center rounded-full border border-border-strong px-8 font-medium text-text-primary transition-colors duration-200 hover:bg-taxi-yellow/10"
          >
            Pré-análise grátis
          </Link>
        </motion.div>
        <motion.a
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.75, duration: 0.7 }}
          href="https://wa.me/5511942299144"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-text-faint transition-colors hover:text-taxi-yellow"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Prefere conversar? WhatsApp →
        </motion.a>
      </div>
    </section>
  );
}
