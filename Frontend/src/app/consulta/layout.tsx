import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consulta de Reparación',
  description: 'Portal de consulta y seguimiento en vivo del estado de tu orden de servicio técnico en Hospital del Computador Riobamba.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ConsultaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
