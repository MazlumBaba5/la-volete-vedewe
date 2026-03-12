import type { Metadata } from 'next';
import './globals.css';
import AgeGateModal from '@/components/layout/AgeGateModal'

export const metadata: Metadata = {
  title: {
    default: 'Lvvd – Listings Across Netherlands',
    template: '%s | Lvvd',
  },
  description:
    'The largest adult listings portal in Netherlands. Find companions, massage professionals and more in your city.',
  keywords: ['listings', 'companions', 'escort Netherlands', 'massage'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <AgeGateModal />
      </body>
    </html>
  );
}
