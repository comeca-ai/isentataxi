import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEADLINE = new Date('2026-12-31T23:59:59-03:00').getTime();

function daysLeft() {
  return Math.max(0, Math.ceil((DEADLINE - Date.now()) / 86_400_000));
}

const NAV_LINKS = [
  { to: '/simulador', label: 'Simulador' },
  { to: '/pre-analise', label: 'Pré-análise' },
  { to: '/guia', label: 'Guia' },
  { to: '/#faq', label: 'FAQ' },
];

/** Strip de urgência: barra zebrada animada 8px + aviso marquee (bg amarelo, texto preto) */
function UrgencyStrip() {
  const days = daysLeft();
  const items = [
    `Teto de R$ 200 mil garantido só até 31/12/2026 — faltam ${days} dias`,
    'Carência entre benefícios sobe de 2 para 3 anos em 2027',
    'Quem usar até 2026 fica na regra boa',
  ];
  const line = items.map((t) => `⚠ ${t}`).join('   ·   ');
  return (
    <div className="relative">
      <div className="zebra-animated h-2 w-full" aria-hidden="true" />
      <div className="marquee-paused overflow-hidden bg-taxi-yellow py-1.5">
        <div className="marquee-track flex w-max animate-marquee-slow items-center whitespace-nowrap">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              className="flex items-center gap-2 pr-12 text-[0.8125rem] font-bold text-bg-base"
              aria-hidden={copy === 1}
            >
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50"
    >
      <UrgencyStrip />
      <nav className="border-b border-border-subtle bg-bg-base/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="IsentaTáxi — início">
            <img src="/logo-icon.svg" alt="" className="h-9 w-9" />
            <span className="font-display text-lg uppercase tracking-[-0.01em]">
              Isenta<span className="text-taxi-yellow">Táxi</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) =>
              link.to.startsWith('/#') ? (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative text-sm font-medium text-text-muted transition-colors hover:text-text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-taxi-yellow after:transition-all hover:after:w-full"
                >
                  {link.label}
                </Link>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'relative text-sm font-medium transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:bg-taxi-yellow after:transition-all',
                      isActive
                        ? 'text-text-primary after:w-full'
                        : 'text-text-muted hover:text-text-primary after:w-0 hover:after:w-full',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ),
            )}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {/* AUTH-SLOT: rewired to useAuth() in Phase 5 */}
            <Link
              to="/login"
              className="rounded-full px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-taxi-yellow/10 hover:text-text-primary"
            >
              Entrar
            </Link>
            <Link
              to="/simulador"
              className="group flex h-[44px] items-center gap-2 rounded-full bg-taxi-yellow px-5 text-sm font-bold text-bg-base transition-all duration-200 hover:scale-[1.03] hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
            >
              Simular grátis
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-primary lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer full-screen */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex flex-col bg-bg-base lg:hidden"
          >
            <div className="zebra h-2 w-full" aria-hidden="true" />
            <div className="flex h-16 items-center justify-between px-5">
              <span className="font-display text-lg uppercase">
                Isenta<span className="text-taxi-yellow">Táxi</span>
              </span>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2 px-8">
              {[{ to: '/', label: 'Início' }, ...NAV_LINKS].map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="block py-2 font-display text-[2rem] uppercase leading-none text-text-primary transition-colors hover:text-taxi-yellow"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + 5 * 0.06, duration: 0.4 }}
                className="mt-6 flex flex-col gap-3"
              >
                <Link
                  to="/simulador"
                  onClick={() => setOpen(false)}
                  className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-taxi-yellow font-bold text-bg-base"
                >
                  Simular grátis <ArrowRight className="h-4 w-4" />
                </Link>
                {/* AUTH-SLOT: rewired to useAuth() in Phase 5 */}
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex h-[52px] items-center justify-center rounded-full border border-border-strong font-medium text-text-primary"
                >
                  Entrar
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
