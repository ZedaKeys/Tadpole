'use client';

import dynamic from 'next/dynamic';

const ClientPWAProvider = dynamic(
  () => import('@/components/pwa/ClientPWAProvider'),
  { ssr: false }
);

export default function PWAMount() {
  return <ClientPWAProvider />;
}
