import { Link } from 'react-router';
import { MessageCircle, Clock } from 'lucide-react';

const NAV = [
  { to: '/#plataforma', label: 'Plataforma' },
  { to: '/#como-funciona', label: 'Como funciona' },
  { to: '/#planos', label: 'Planos' },
  { to: '/#faq', label: 'FAQ' },
];

const LEGAL = [
  { to: '/guia#lgpd', label: 'LGPD' },
  { to: '/guia#termos', label: 'Termos de uso' },
  { to: '/guia#privacidade', label: 'Privacidade' },
];

export default function Footer() {
  return (
    <footer className="relative">
      <div className="zebra h-2 w-full" aria-hidden="true" />
      <div className="bg-bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 md:px-8 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo-icon.svg" alt="" className="h-9 w-9" loading="lazy" />
              <span className="font-display text-lg uppercase">
                Despacha<span className="text-taxi-yellow">.Ai</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              A plataforma do despachante de isenções. Hoje no vertical Táxi — PCD em breve.
            </p>
          </div>

          <nav aria-label="Navegação">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-primary">Navegação</h3>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-text-muted transition-colors hover:text-taxi-yellow">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-primary">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-text-muted transition-colors hover:text-taxi-yellow">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-primary">Contato</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="https://wa.me/5511942299144"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-taxi-yellow"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp (11) 94229-9144
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-text-muted">
                <Clock className="h-4 w-4" aria-hidden="true" /> Seg–Sáb 8h–20h
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer obrigatório (todas as páginas) */}
        <div className="border-t border-border-subtle">
          <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">
            <p className="text-[0.8125rem] leading-relaxed text-text-faint">
              Sem promessa de aprovação — quem defere o benefício é o órgão público (Receita Federal / Sefaz-SP /
              Prefeitura de SP). Nunca pedimos senha, código MFA ou sessão do Gov.br. Valores do simulador são
              estimativas com base nas alíquotas vigentes.
            </p>
            <p className="mt-4 text-[0.8125rem] text-text-faint">Feito em São Paulo © 2026 Despacha.Ai</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
