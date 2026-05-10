'use client';


import { Brain, Dices, Sword } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AppShell } from '@/components/layout/AppShell';

interface GameInfo {
  id: string;
  name: string;
  description: string;
  href?: string;
  icon: React.ReactNode;
  badge?: { label: string; color: string };
  accentColor: string;
}

const GAMES: GameInfo[] = [
  {
    id: 'trivia',
    name: 'BG3 Trivia',
    description: 'Test your knowledge of Baldur\'s Gate 3 with questions ranging from story and lore to mechanics and companions.',
    href: '/games/trivia',
    icon: <Brain size={32} />,
    accentColor: '#a855f7',
  },
  {
    id: 'dice-poker',
    name: 'Dice Poker',
    description: 'A classic dice game with a BG3 twist. Bet, roll, and bluff your way to victory against companions.',
    href: '/games/dice-poker',
    icon: <Dices size={32} />,
    accentColor: '#f59e0b',
  },
  {
    id: 'tracker',
    name: 'Loot Tracker',
    description: 'Log items found during gameplay, track session stats, and export your haul for sharing.',
    href: '/tracker',
    icon: <Sword size={32} />,
    badge: { label: 'NEW', color: '#52b788' },
    accentColor: '#52b788',
  },
];

export default function GamesPage() {
  return (
    <AppShell title="Mini-Games">
      <p
        className="mb-5 stagger-in"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', animationDelay: '0s' }}
      >
        {GAMES.length} game{GAMES.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {GAMES.map((game, i) => (
          <Card
            key={game.id}
            title={game.name}
            href={game.href}
            accentColor={game.accentColor}
            delay={i * 0.08}
            description={
              game.badge ? (
                <span className="flex items-center gap-2">
                  {game.description}
                  <Badge label={game.badge.label} color={game.badge.color} />
                </span>
              ) : (
                game.description
              )
            }
            icon={<div style={{ color: 'var(--gold-bright)' }}>{game.icon}</div>}
          />
        ))}
      </div>
    </AppShell>
  );
}
