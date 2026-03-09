import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'EscortItalia – Annunci in tutta Italia',
    template: '%s | EscortItalia',
  },
  description:
    'Il portale di annunci personali più grande in Italia. Trova accompagnatrici, massaggiatrici e tanto altro nella tua città.',
  keywords: ['annunci', 'accompagnatrici', 'escort italia', 'massaggi'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
