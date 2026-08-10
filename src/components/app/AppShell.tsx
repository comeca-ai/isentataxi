import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import {
  Bell,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  FolderUp,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/app', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/app/documentos', label: 'Meus documentos', icon: FolderUp },
  { to: '/app/cadastro', label: 'Meu cadastro', icon: UserRound },
];

const EXTERNAL = [
  { to: '/guia', label: 'Guia', icon: BookOpen },
  { to: 'https://wa.me/5511942299144', label: 'Suporte WhatsApp', icon: MessageCircle, external: true },
];

const BREADCRUMB: Record<string, string> = {
  '/app': 'Painel',
  '/app/documentos': 'Meus documentos',
  '/app/cadastro': 'Meu cadastro',
};

/** Shell do cliente (/app/*): sidebar 264px (colapsável 72px) + topbar; bottom-tab-bar no mobile */
export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const section = BREADCRUMB[location.pathname] ?? 'Painel';

  return (
    <div className="min-h-[100dvh] bg-bg-base text-text-primary">
      {/* Sidebar (desktop) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border-subtle bg-bg-surface transition-[width] duration-200 md:flex',
          collapsed ? 'w-[72px]' : 'w-[264px]',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-border-subtle px-4">
          <img src="/logo-icon.svg" alt="" className="h-9 w-9 shrink-0" />
          {!collapsed && (
            <span className="font-display text-base uppercase">
              Isenta<span className="text-taxi-yellow">Táxi</span>
            </span>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Área do cliente">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-taxi-yellow/10 text-taxi-yellow'
                    : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!collapsed && item.label}
            </NavLink>
          ))}
          <div className="my-3 border-t border-border-subtle" />
          {EXTERNAL.map((item) =>
            item.external ? (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && item.label}
              </Link>
            ),
          )}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-3 flex h-10 items-center justify-center gap-2 rounded-xl border border-border-subtle text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-xs">Recolher</span>}
        </button>
      </aside>

      {/* Conteúdo */}
      <div className={cn('flex min-h-[100dvh] flex-col transition-[margin] duration-200', collapsed ? 'md:ml-[72px]' : 'md:ml-[264px]')}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border-subtle bg-bg-base/80 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3 text-sm">
            <Link to="/app" className="text-text-faint transition-colors hover:text-text-muted">
              Área do cliente
            </Link>
            <span className="text-text-faint">/</span>
            <span className="font-medium text-text-primary">{section}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-taxi-yellow/30 bg-taxi-yellow/10 px-3 py-1 font-mono text-xs text-taxi-yellow sm:inline-block">
              Etapa 3/7 — DTP
            </span>
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-alert-red" aria-hidden="true" />
            </button>
            <div className="group relative">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-taxi-yellow font-bold text-bg-base"
                aria-label="Menu da conta"
              >
                T
              </button>
              <div className="invisible absolute right-0 top-12 w-44 rounded-xl border border-border-subtle bg-bg-elevated p-1.5 opacity-0 shadow-lg transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                {/* AUTH-SLOT: rewired to useAuth() in Phase 5 */}
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-6 pb-24 md:pb-10 lg:p-10">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border-subtle bg-bg-surface md:hidden"
        aria-label="Área do cliente"
      >
        {[...ITEMS, { to: 'https://wa.me/5511942299144', label: 'Suporte', icon: MessageCircle, external: true }].map((item) =>
          'external' in item && item.external ? (
            <a
              key={item.to}
              href={item.to}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium text-text-muted"
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </a>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item && item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium',
                  isActive ? 'text-taxi-yellow' : 'text-text-muted',
                )
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
