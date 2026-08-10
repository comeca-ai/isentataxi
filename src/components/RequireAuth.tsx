import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { LOGIN_PATH } from '@/const';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayoutSkeleton } from './AuthLayoutSkeleton';

/**
 * Guarda de rota autenticada: mostra skeleton enquanto carrega e redireciona
 * para o login (OAuth auto-provisiona usuários — não há fluxo de cadastro).
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLayoutSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
