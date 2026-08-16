import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { CalendarDays, FolderCheck, KanbanSquare, LayoutDashboard, LogOut, Search, ShieldAlert, Users } from 'lucide-react';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/admin/leads', label: 'Leads', icon: Users },
  { to: '/admin/processos', label: 'Processos', icon: KanbanSquare },
  { to: '/admin/documentos', label: 'Documentos', icon: FolderCheck, badge: '12' },
];

/** Shell admin (/admin/*): sidebar bg-[#0D0D0F] + topbar com busca global, filtro de período e avatar */
export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AdminShellGuard>{children}</AdminShellGuard>
    </RequireAuth>
  );
}

/** Apenas a equipe (role admin) acessa o painel admin */
function AdminShellGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg-base px-6 text-text-primary">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <ShieldAlert className="h-10 w-10 text-taxi-yellow" aria-hidden="true" />
          <h1 className="font-display text-2xl uppercase">Acesso restrito à equipe</h1>
          <p className="text-sm text-text-muted">
            Esta área é exclusiva da equipe IsentaTáxi. Se você é taxista, acompanhe seu processo no painel do cliente.
          </p>
          <Link
            to="/app"
            className="mt-2 flex h-11 items-center rounded-full bg-taxi-yellow px-6 text-sm font-bold text-bg-base transition-colors hover:bg-taxi-yellow-hover"
          >
            Ir para meu painel
          </Link>
        </div>
      </div>
    );
  }

  return <AdminShellContent>{children}</AdminShellContent>;
}

function AdminShellContent({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const initial = (user?.name?.trim().charAt(0) ?? 'A').toUpperCase();
  return (
    <div className="min-h-[100dvh] bg-bg-base text-text-primary">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-border-subtle bg-[#0D0D0F] md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border-subtle px-4">
          <img src="/logo-icon.svg" alt="" className="h-9 w-9 shrink-0" />
          <div className="leading-tight">
            <span className="block font-display text-base uppercase">
              Isenta<span className="text-taxi-yellow">Táxi</span>
            </span>
            <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-text-faint">Admin</span>
          </div>
        </div>
        <div className="px-4 pb-1 pt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
          Operação
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Administração">
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
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-alert-red px-2 py-0.5 font-mono text-[0.65rem] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border-subtle p-4 text-[0.65rem] text-text-faint">
          <Link to="/" className="transition-colors hover:text-text-muted">
            ← Voltar ao site
          </Link>
        </div>
      </aside>

      <div className="flex min-h-[100dvh] flex-col md:ml-[264px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-subtle bg-bg-base/80 px-5 backdrop-blur-md md:px-8">
          <button className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 text-sm text-text-faint transition-colors hover:border-border-strong md:max-w-sm">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1 text-left">Buscar leads, processos, placas…</span>
            <kbd className="hidden rounded border border-border-strong px-1.5 py-0.5 font-mono text-[0.65rem] text-text-faint md:inline-block">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <button className="hidden h-10 items-center gap-2 rounded-xl border border-border-subtle px-3 text-sm text-text-muted transition-colors hover:border-border-strong sm:flex">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Últimos 30 dias
            </button>
            <div className="group relative">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated font-bold text-taxi-yellow ring-1 ring-border-strong"
                aria-label="Conta do administrador"
              >
                {initial}
              </button>
              <div className="invisible absolute right-0 top-12 w-56 rounded-xl border border-border-subtle bg-bg-elevated p-1.5 opacity-0 shadow-lg transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="border-b border-border-subtle px-3 py-2">
                  <p className="truncate text-sm font-medium text-text-primary">{user?.name ?? 'Administrador'}</p>
                  {user?.email && <p className="truncate text-xs text-text-faint">{user.email}</p>}
                </div>
                <button
                  onClick={() => logout()}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-6 pb-24 md:pb-10 lg:p-10">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border-subtle bg-[#0D0D0F] md:hidden"
        aria-label="Administração"
      >
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium',
                isActive ? 'text-taxi-yellow' : 'text-text-muted',
              )
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
            {item.badge && (
              <span className="absolute right-3 top-1.5 rounded-full bg-alert-red px-1.5 font-mono text-[0.6rem] font-bold text-white">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
