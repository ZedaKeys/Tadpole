'use client';

import { Brain, Dices, Lock } from 'lucide-react';
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
}

const GAMES: GameInfo[] = [
  {
    id: 'trivia',
    name: 'BG3 Trivia',
    description: 'Test your knowledge of Baldur\'s Gate 3 with questions ranging from story and lore to mechanics and companions.',
    href: '/games/trivia',
    icon: <Brain size={32} />,
  },
  {
    id: 'dice-poker',
    name: 'Dice Poker',
    description: 'A classic dice game with a BG3 twist. Bet, roll, and bluff your way to victory.',
    icon: <Dices size={32} />,
    badge: { label: 'Coming Soon', color: '#6b7280' },
  },
];

export default function GamesPage() {
  return (
    <AppShell title="Mini-Games">
      <p
        className="mb-3"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {GAMES.length} game{GAMES.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-3">
        {GAMES.map((game) => (
          <Card
            key={game.id}
            title={game.name}
            href={game.href}
            description={game.description}
            icon={
              <div className="flex items-center gap-2">
                <div style={{ color: 'var(--accent)' }}>{game.icon}</div>
                {game.badge && (
                  <Badge label={game.badge.label} color={game.badge.color} />
                )}
              </div>
            }
          />
        ))}
      </div>
    </AppShell>
  );
}
