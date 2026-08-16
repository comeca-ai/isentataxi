import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { WHATSAPP_URL } from '@contracts/constants';
import { LOGIN_PATH } from '@/const';
import Reveal, { RevealItem } from '@/components/Reveal';

/** Bloco 8 — CTA final: banner com glow radial pulsante */
export default function FinalCtaBanner() {
  return (
    <section className="py-14 md:py-20">
      <Reveal>
        <RevealItem>
          <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface p-10 text-center">
            <motion.div
              className="hero-glow absolute inset-0"
              animate={{ opacity: [0.12, 0.2, 0.12] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
                Leu tudo? <span className="text-taxi-yellow">Agora simula.</span>
              </h2>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-15% 0px' }}
                transition={{ staggerChildren: 0.12, delayChildren: 0.2 }}
                className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <Link
                    to="/simulador"
                    className="group flex h-[52px] items-center gap-2 rounded-full bg-taxi-yellow px-8 font-bold text-bg-base transition-all duration-200 hover:scale-[1.03] hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
                  >
                    Simular grátis
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <Link
                    to="/pre-analise"
                    className="flex h-[52px] items-center gap-2 rounded-full border border-border-strong px-8 font-medium text-text-primary transition-colors duration-200 hover:bg-taxi-yellow/10"
                  >
                    Fazer pré-análise grátis
                  </Link>
                </motion.div>
              </motion.div>

              <p className="mt-6 text-sm text-text-muted">Sem cadastro. Sem senha Gov.br.</p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-money-green transition-colors hover:text-text-primary"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Dúvidas? Chama no WhatsApp
                </a>
                <Link to={LOGIN_PATH} className="font-medium text-text-muted transition-colors hover:text-text-primary">
                  Já é cliente? Entrar
                </Link>
              </div>

              <p className="mx-auto mt-8 max-w-2xl border-t border-border-subtle pt-6 text-[0.8125rem] leading-relaxed text-text-faint">
                Sem promessa de aprovação — quem defere o benefício é o órgão público (Receita Federal /
                Sefaz-SP / Prefeitura de SP). Nunca pedimos senha, código MFA ou sessão do Gov.br. Valores do
                simulador são estimativas com base nas alíquotas vigentes.
              </p>
            </div>
          </div>
        </RevealItem>
      </Reveal>
    </section>
  );
}
