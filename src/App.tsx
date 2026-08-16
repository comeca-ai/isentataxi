import { Routes, Route } from 'react-router';
import Layout from '@/components/Layout';
import AppShell from '@/components/app/AppShell';
import AdminShell from '@/components/admin/AdminShell';
import Home from '@/pages/Home';
import Simulador from '@/pages/Simulador';
import PreAnalise from '@/pages/PreAnalise';
import Guia from '@/pages/Guia';
import Login from '@/pages/Login';
import AppDashboard from '@/pages/app/AppDashboard';
import AppDocumentos from '@/pages/app/AppDocumentos';
import AppCadastro from '@/pages/app/AppCadastro';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminLeads from '@/pages/admin/AdminLeads';
import AdminProcessos from '@/pages/admin/AdminProcessos';
import AdminDocumentos from '@/pages/admin/AdminDocumentos';

export default function App() {
  return (
    <Routes>
      {/* Público — Layout usa <Outlet/> (nested routes) */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="simulador" element={<Simulador />} />
        <Route path="pre-analise" element={<PreAnalise />} />
        <Route path="guia" element={<Guia />} />
        <Route path="login" element={<Login />} />
      </Route>

      {/* Cliente — AppShell usa {children} */}
      <Route path="/app" element={<AppShell><AppDashboard /></AppShell>} />
      <Route path="/app/documentos" element={<AppShell><AppDocumentos /></AppShell>} />
      <Route path="/app/cadastro" element={<AppShell><AppCadastro /></AppShell>} />

      {/* Admin — AdminShell usa {children} */}
      <Route path="/admin" element={<AdminShell><AdminOverview /></AdminShell>} />
      <Route path="/admin/leads" element={<AdminShell><AdminLeads /></AdminShell>} />
      <Route path="/admin/processos" element={<AdminShell><AdminProcessos /></AdminShell>} />
      <Route path="/admin/documentos" element={<AdminShell><AdminDocumentos /></AdminShell>} />
    </Routes>
  );
}
