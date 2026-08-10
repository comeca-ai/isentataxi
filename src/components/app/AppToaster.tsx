import { Toaster } from 'sonner';

/** Toaster Sonner dark para a área do cliente (montado pelas páginas /app/*) */
export default function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: '#1B1B1F',
          border: '1px solid #27272A',
          color: '#FAFAFA',
        },
      }}
    />
  );
}
