'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Coins, Trophy, RotateCcw, Swords, Skull, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';

// ── Types ──────────────────────────────────────────────────────
type GamePhase = 'setup' | 'betting' | 'rolling' | 'player-select' | 'rerolling' | 'opponent-turn' | 'result';
type HandRank =
  | 'Five of a Kind'
  | 'Four of a Kind'
  | 'Full House'
  | 'Straight'
  | 'Three of a Kind'
  | 'Two Pairs'
  | 'One Pair'
  | 'Nothing';

interface Opponent {
  id: string;
  name: string;
  class: string;
  color: string;
  emoji: string;
  strategy: 'risky' | 'safe' | 'big' | 'balanced' | 'aggressive' | 'wise';
  taunt: string[];
  winLine: string[];
  loseLine: string[];
}

interface HandResult {
  rank: HandRank;
  score: number;
  description: string;
}

// ── Constants ──────────────────────────────────────────────────
const HAND_RANK_ORDER: HandRank[] = [
  'Five of a Kind',
  'Four of a Kind',
  'Full House',
  'Straight',
  'Three of a Kind',
  'Two Pairs',
  'One Pair',
  'Nothing',
];

const OPPONENTS: Opponent[] = [
  {
    id: 'astarion',
    name: 'Astarion',
    class: 'Rogue',
    color: '#c084fc',
    emoji: '🧛',
    strategy: 'risky',
    taunt: [
      'Darling, I\'ve been gambling for centuries. You don\'t stand a chance.',
      'Shall we make this... interesting?',
      'I do love a good game of chance. And take.',
    ],
    winLine: [
      'Better luck next time, darling.',
      'Oh, did I take too much? I never know when to stop.',
    ],
    loseLine: [
      'Well... that was merely a warm-up round.',
      'Impossible. The dice must be weighted.',
    ],
  },
  {
    id: 'shadowheart',
    name: 'Shadowheart',
    class: 'Cleric',
    color: '#6366f1',
    emoji: '🌙',
    strategy: 'safe',
    taunt: [
      'Shar guides my hand. Even in games of chance.',
      'Don\'t bet more than you can afford to lose.',
      'I\'ve played darker games than this.',
    ],
    winLine: [
      'The Lady of Loss provides.',
      'Perhaps next time, pray to your own gods.',
    ],
    loseLine: [
      'The dice are fickle. Even for the faithful.',
      'Enjoy it while it lasts.',
    ],
  },
  {
    id: 'karlach',
    name: 'Karlach',
    class: 'Barbarian',
    color: '#f97316',
    emoji: '🔥',
    strategy: 'big',
    taunt: [
      'LET\'S GOOOO! High stakes, baby!',
      'I\'ve got a good feeling about this! And by good I mean HOT.',
      'Scoot over, soldier — time to lose some gold!',
    ],
    winLine: [
      'HAHAHA YES! That\'s what I\'m talking about!',
      'FURY OF THE DICE! Karlach wins again!',
    ],
    loseLine: [
      'Aw man, that was SO close!',
      'No worries! We go again, yeah? BEST OUT OF THREE!',
    ],
  },
  {
    id: 'laezel',
    name: "Lae'zel",
    class: 'Fighter',
    color: '#eab308',
    emoji: '⚔️',
    strategy: 'aggressive',
    taunt: [
      'Your dice skills are as weak as your combat stance.',
      'I do not gamble. I conquer.',
      'This will be over quickly. Chk.',
    ],
    winLine: [
      'As expected. Victory is its own reward. Chk.',
      'You fought well. For a ghaik.',
    ],
    loseLine: [
      'The dice betrayed me. They will not do so again.',
      'A temporary setback. I demand a rematch.',
    ],
  },
  {
    id: 'gale',
    name: 'Gale',
    class: 'Wizard',
    color: '#60a5fa',
    emoji: '📚',
    strategy: 'balanced',
    taunt: [
      'I\'ve calculated the optimal reroll strategy. You cannot win.',
      'Probability favors the prepared mind.',
      'Shall we make this educational as well?',
    ],
    winLine: [
      'Mathematics triumphs once again.',
      'As Mystra intended. Er, as probability intended.',
    ],
    loseLine: [
      'Statistically improbable, yet here we are.',
      'I may need to recalculate my approach.',
    ],
  },
  {
    id: 'wyll',
    name: 'Wyll',
    class: 'Warlock',
    color: '#ec4899',
    emoji: '🎭',
    strategy: 'balanced',
    taunt: [
      'The Blade of Frontiers has never backed down from a wager!',
      'Fortune favors the bold, they say.',
      'Care to dance with Lady Luck?',
    ],
    winLine: [
      'A tale worth telling! The Blade triumphs again!',
      'My patron\'s luck rubs off, it seems.',
    ],
    loseLine: [
      'Well fought! A worthy opponent indeed.',
      'The Blade is down, but never out!',
    ],
  },
];

// ── Game Logic ─────────────────────────────────────────────────
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollFiveDice(): number[] {
  return Array.from({ length: 5 }, () => rollD20());
}

function evaluateHand(dice: number[]): HandResult {
  const counts: Record<number, number> = {};
  for (const d of dice) counts[d] = (counts[d] || 0) + 1;

  const freq = Object.values(counts).sort((a, b) => b - a);
  const sorted = [...dice].sort((a, b) => a - b);
  const isSequential = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);

  if (freq[0] === 5) return { rank: 'Five of a Kind', score: 800, description: `Five ${dice[0]}s!` };
  if (freq[0] === 4) {
    const quadVal = +Object.entries(counts).find(([, c]) => c === 4)![0];
    return { rank: 'Four of a Kind', score: 700, description: `Four ${quadVal}s` };
  }
  if (freq[0] === 3 && freq[1] === 2) {
    const tripleVal = +Object.entries(counts).find(([, c]) => c === 3)![0];
    return { rank: 'Full House', score: 600, description: `Full House: ${tripleVal}s over pair` };
  }
  if (isSequential) return { rank: 'Straight', score: 500, description: `Straight: ${sorted[0]}-${sorted[4]}` };
  if (freq[0] === 3) {
    const tripleVal = +Object.entries(counts).find(([, c]) => c === 3)![0];
    return { rank: 'Three of a Kind', score: 400, description: `Three ${tripleVal}s` };
  }
  if (freq[0] === 2 && freq[1] === 2) {
    const pairs = Object.entries(counts)
      .filter(([, c]) => c === 2)
      .map(([v]) => +v)
      .sort((a, b) => b - a);
    return { rank: 'Two Pairs', score: 300, description: `Two Pairs: ${pairs[0]}s & ${pairs[1]}s` };
  }
  if (freq[0] === 2) {
    const pairVal = +Object.entries(counts).find(([, c]) => c === 2)![0];
    return { rank: 'One Pair', score: 200, description: `Pair of ${pairVal}s` };
  }
  const high = Math.max(...dice);
  return { rank: 'Nothing', score: 100, description: `High die: ${high}` };
}

function getAIKeptIndices(dice: number[], strategy: Opponent['strategy']): number[] {
  const hand = evaluateHand(dice);
  const kept: number[] = [];

  switch (strategy) {
    case 'risky': {
      // Astarion: always rerolls everything unless he has 3+ of a kind
      if (hand.score >= 400) return [0, 1, 2, 3, 4]; // keep all
      if (hand.rank === 'Two Pairs') return [0, 1, 2, 3, 4];
      if (hand.rank === 'One Pair') {
        const counts: Record<number, number> = {};
        dice.forEach((d, i) => { counts[d] = (counts[d] || 0) + 1; });
        dice.forEach((d, i) => { if (counts[d] >= 2) kept.push(i); });
        return kept;
      }
      // Risky: reroll everything
      return [];
    }
    case 'safe': {
      // Shadowheart: keeps pairs and above, rerolls singles
      const counts: Record<number, number> = {};
      dice.forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
      dice.forEach((d, i) => { if (counts[d] >= 2) kept.push(i); });
      if (kept.length === 0) {
        // Keep highest die
        const maxVal = Math.max(...dice);
        kept.push(dice.indexOf(maxVal));
      }
      return kept;
    }
    case 'big': {
      // Karlach: keeps high dice (12+), always rerolls low ones
      dice.forEach((d, i) => { if (d >= 14) kept.push(i); });
      if (kept.length === 0) kept.push(dice.indexOf(Math.max(...dice)));
      return kept;
    }
    case 'aggressive': {
      // Laezel: keeps only triples+, rerolls aggressively
      if (hand.score >= 400) return [0, 1, 2, 3, 4];
      if (hand.rank === 'Two Pairs') return [0, 1, 2, 3, 4];
      if (hand.rank === 'One Pair') {
        const counts: Record<number, number> = {};
        dice.forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
        dice.forEach((d, i) => { if (counts[d] >= 2) kept.push(i); });
        return kept;
      }
      // Keep only the single highest
      const maxIdx = dice.indexOf(Math.max(...dice));
      return [maxIdx];
    }
    case 'balanced': {
      // Gale/Wyll: keeps pairs+, keeps high singles
      const counts: Record<number, number> = {};
      dice.forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
      dice.forEach((d, i) => { if (counts[d] >= 2) kept.push(i); });
      if (kept.length === 0) {
        dice.forEach((d, i) => { if (d >= 12) kept.push(i); });
      }
      if (kept.length === 0) {
        const maxVal = Math.max(...dice);
        kept.push(dice.indexOf(maxVal));
      }
      return kept;
    }
    default:
      return [0, 1, 2, 3, 4];
  }
}

// ── Components ─────────────────────────────────────────────────

function DiceDisplay({
  dice,
  keptIndices,
  onToggle,
  rolling,
  disabled,
}: {
  dice: number[];
  keptIndices: number[];
  onToggle?: (index: number) => void;
  rolling: boolean;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
      {dice.map((value, i) => {
        const isKept = keptIndices.includes(i);
        return (
          <button
            key={i}
            onClick={() => onToggle?.(i)}
            disabled={disabled || rolling}
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              border: `2px solid ${isKept ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}`,
              background: isKept
                ? 'linear-gradient(135deg, rgba(198,162,85,0.2), rgba(198,162,85,0.08))'
                : 'rgba(255,255,255,0.03)',
              color: isKept ? 'var(--gold)' : '#e8e8ef',
              fontSize: rolling ? '0.7rem' : '1.1rem',
              fontWeight: 700,
              fontFamily: "'SF Mono', 'Cascadia Code', ui-monospace, monospace",
              cursor: disabled || rolling ? 'default' : 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: isKept ? '0 0 12px rgba(198,162,85,0.3)' : 'none',
              animation: rolling ? 'dice-tumble 0.1s linear infinite' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: '0.55rem', opacity: 0.5, marginBottom: 2 }}>d20</span>
            {rolling ? '?' : value}
          </button>
        );
      })}
    </div>
  );
}

function OpponentSelector({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {OPPONENTS.map((opp) => {
        const isActive = selected === opp.id;
        return (
          <button
            key={opp.id}
            onClick={() => onSelect(opp.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 16,
              border: `2px solid ${isActive ? opp.color : 'rgba(255,255,255,0.06)'}`,
              background: isActive
                ? `linear-gradient(135deg, ${opp.color}18, rgba(255,255,255,0.02))`
                : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              textAlign: 'left' as const,
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{opp.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: isActive ? opp.color : '#e8e8ef', fontWeight: 600, fontSize: '0.875rem' }}>
                {opp.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{opp.class}</div>
            </div>
            {isActive && (
              <span style={{ color: opp.color, fontSize: '0.7rem', fontWeight: 700 }}>SELECTED</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function GoldDisplay({ amount }: { amount: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 9999,
        background: 'rgba(198,162,85,0.12)',
        border: '1px solid rgba(198,162,85,0.2)',
      }}
    >
      <Coins size={14} style={{ color: '#c6a255' }} />
      <span
        style={{
          color: '#c6a255',
          fontWeight: 700,
          fontSize: '0.85rem',
          fontFamily: "'SF Mono', 'Cascadia Code', ui-monospace, monospace",
        }}
      >
        {amount}
      </span>
    </div>
  );
}

// ── Main Game Page ─────────────────────────────────────────────
export default function DicePokerPage() {
  const router = useRouter();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [gold, setGold] = useState(100);
  const [bet, setBet] = useState(10);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [playerDice, setPlayerDice] = useState<number[]>([0, 0, 0, 0, 0]);
  const [opponentDice, setOpponentDice] = useState<number[]>([0, 0, 0, 0, 0]);
  const [playerKept, setPlayerKept] = useState<number[]>([]);
  const [opponentKept, setOpponentKept] = useState<number[]>([]);
  const [playerHand, setPlayerHand] = useState<HandResult | null>(null);
  const [opponentHand, setOpponentHand] = useState<HandResult | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [dialogue, setDialogue] = useState<string>('');
  const [resultMessage, setResultMessage] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [rollingPhase, setRollingPhase] = useState(false);
  const rollCountRef = useRef(0);
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const opponent = OPPONENTS.find((o) => o.id === opponentId) ?? null;

  const randomPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const animateRoll = useCallback(
    (callback: () => void, duration = 600) => {
      setRollingPhase(true);
      rollCountRef.current = 0;
      const totalFrames = Math.floor(duration / 60);

      rollIntervalRef.current = setInterval(() => {
        rollCountRef.current++;
        setPlayerDice(rollFiveDice());
        setOpponentDice(rollFiveDice());

        if (rollCountRef.current >= totalFrames) {
          if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
          setRollingPhase(false);
          callback();
        }
      }, 60);
    },
    [],
  );

  const animateReroll = useCallback(
    (dice: number[], keptIndices: number[], setDice: (d: number[]) => void, callback: () => void, duration = 500) => {
      setRollingPhase(true);
      rollCountRef.current = 0;
      const totalFrames = Math.floor(duration / 60);

      rollIntervalRef.current = setInterval(() => {
        rollCountRef.current++;
        const newDice = dice.map((d, i) =>
          keptIndices.includes(i) ? d : rollD20(),
        );
        setDice(newDice);

        if (rollCountRef.current >= totalFrames) {
          if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
          setRollingPhase(false);
          callback();
        }
      }, 60);
    },
    [],
  );

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    };
  }, []);

  const startGame = useCallback(() => {
    if (!opponentId) return;
    const opp = OPPONENTS.find((o) => o.id === opponentId)!;
    setDialogue(randomPick(opp.taunt));
    setResultMessage(null);
    setPlayerHand(null);
    setOpponentHand(null);
    setPlayerKept([]);
    setOpponentKept([]);
    setPhase('rolling');

    // Roll initial dice
    const pDice = rollFiveDice();
    const oDice = rollFiveDice();
    setPlayerDice(pDice);
    setOpponentDice(oDice);

    animateRoll(() => {
      setPlayerDice(pDice);
      setOpponentDice(oDice);
      setPhase('player-select');
    }, 700);
  }, [opponentId, animateRoll]);

  const handleToggleDie = useCallback((index: number) => {
    setPlayerKept((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }, []);

  const handleReroll = useCallback(() => {
    if (!opponent) return;
    setPhase('rerolling');

    const kept = [...playerKept];
    const newPlayerDice = playerDice.map((d, i) =>
      kept.includes(i) ? d : rollD20(),
    );

    // AI decides what to keep
    const aiKept = getAIKeptIndices(opponentDice, opponent.strategy);
    setOpponentKept(aiKept);

    const newOpponentDice = opponentDice.map((d, i) =>
      aiKept.includes(i) ? d : rollD20(),
    );

    animateReroll(
      playerDice,
      kept,
      setPlayerDice,
      () => {},
      400,
    );

    setTimeout(() => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      setRollingPhase(false);
      setPlayerDice(newPlayerDice);
      setOpponentDice(newOpponentDice);
      setPhase('opponent-turn');

      // Evaluate after a brief pause
      setTimeout(() => {
        const pHand = evaluateHand(newPlayerDice);
        const oHand = evaluateHand(newOpponentDice);
        setPlayerHand(pHand);
        setOpponentHand(oHand);

        // Determine winner
        if (pHand.score > oHand.score) {
          setResultMessage('win');
          setGold((prev) => prev + bet);
          setWins((prev) => prev + 1);
          setDialogue(randomPick(opponent.loseLine));
        } else if (oHand.score > pHand.score) {
          setResultMessage('lose');
          setGold((prev) => Math.max(0, prev - bet));
          setLosses((prev) => prev + 1);
          setDialogue(randomPick(opponent.winLine));
        } else {
          // Tie-breaker: compare sum of dice
          const playerSum = newPlayerDice.reduce((a, b) => a + b, 0);
          const oppSum = newOpponentDice.reduce((a, b) => a + b, 0);
          if (playerSum > oppSum) {
            setResultMessage('win');
            setGold((prev) => prev + bet);
            setWins((prev) => prev + 1);
            setDialogue(randomPick(opponent.loseLine));
          } else if (oppSum > playerSum) {
            setResultMessage('lose');
            setGold((prev) => Math.max(0, prev - bet));
            setLosses((prev) => prev + 1);
            setDialogue(randomPick(opponent.winLine));
          } else {
            setResultMessage('draw');
            setDialogue('A perfect draw! The gold remains untouched.');
          }
        }

        setPhase('result');
      }, 800);
    }, 600);
  }, [playerDice, opponentDice, playerKept, opponent, bet, animateReroll]);

  const handleNewRound = useCallback(() => {
    if (gold <= 0) {
      setPhase('setup');
      setGold(100);
      setWins(0);
      setLosses(0);
      return;
    }
    setResultMessage(null);
    setPlayerHand(null);
    setOpponentHand(null);
    setPlayerKept([]);
    setOpponentKept([]);
    setPhase('betting');
  }, [gold]);

  const handleBackToSetup = useCallback(() => {
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    setPhase('setup');
    setResultMessage(null);
    setPlayerHand(null);
    setOpponentHand(null);
    setPlayerKept([]);
    setOpponentKept([]);
    setRollingPhase(false);
  }, []);

  // ── Render ────────────────────────────────────────────────

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <AppShell title="Dice Poker">
        <button
          onClick={() => router.push('/games')}
          className="touch-target stagger-in flex items-center gap-1 mb-5 rounded-lg"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--gold)',
            fontSize: '0.875rem',
            padding: 0,
            minHeight: 44,
            animationDelay: '0s',
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Games</span>
        </button>

        {/* Title & Description */}
        <div className="stagger-in" style={{ marginBottom: 20, animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1.8rem' }}>🎲</span>
            <h2
              className="font-heading"
              style={{ color: '#e8e8ef', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}
            >
              Dice Poker
            </h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', lineHeight: 1.6 }}>
            Roll 5 D20 dice against a BG3 companion. Pick which dice to keep, then reroll the rest once.
            Best hand wins the gold!
          </p>
        </div>

        {/* Score display */}
        <div
          className="stagger-in"
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            animationDelay: '0.1s',
          }}
        >
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginBottom: 2 }}>Gold</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Coins size={14} style={{ color: '#c6a255' }} />
              <span style={{ color: '#c6a255', fontWeight: 700, fontFamily: 'monospace' }}>{gold}</span>
            </div>
          </div>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginBottom: 2 }}>Record</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#52b788', fontWeight: 700, fontFamily: 'monospace' }}>{wins}W</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
              <span style={{ color: '#e76f51', fontWeight: 700, fontFamily: 'monospace' }}>{losses}L</span>
            </div>
          </div>
        </div>

        {/* Hand Rankings Reference */}
        <div
          className="stagger-in"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 20,
            animationDelay: '0.15s',
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Hand Rankings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {HAND_RANK_ORDER.map((rank, i) => (
              <div key={rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: i < 3 ? '#c6a255' : 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: i < 3 ? 600 : 400 }}>
                  {rank}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem' }}>
                  {i === 0 ? '👑' : i <= 2 ? '⭐' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Choose Opponent */}
        <div className="stagger-in" style={{ marginBottom: 20, animationDelay: '0.2s' }}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Choose Your Opponent
          </div>
          <OpponentSelector selected={opponentId} onSelect={setOpponentId} />
        </div>

        {/* Start Button */}
        <button
          onClick={() => {
            if (opponentId && gold > 0) {
              setPhase('betting');
            }
          }}
          disabled={!opponentId || gold <= 0}
          className="stagger-in touch-target w-full py-3 font-semibold"
          style={{
            background: !opponentId || gold <= 0 ? 'rgba(255,255,255,0.06)' : '#c6a255',
            color: !opponentId || gold <= 0 ? 'rgba(255,255,255,0.3)' : '#fff',
            border: 'none',
            minHeight: 44,
            borderRadius: 9999,
            padding: '12px 24px',
            fontSize: '0.9rem',
            cursor: !opponentId || gold <= 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            animationDelay: '0.3s',
          }}
        >
          <Swords size={18} />
          {gold <= 0 ? 'No Gold Left — Reset' : 'Start Game'}
        </button>
      </AppShell>
    );
  }

  // BETTING PHASE
  if (phase === 'betting') {
    const betAmounts = [5, 10, 25, 50];
    return (
      <AppShell title="Dice Poker">
        <button
          onClick={handleBackToSetup}
          className="touch-target stagger-in flex items-center gap-1 mb-5 rounded-lg"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--gold)',
            fontSize: '0.875rem',
            padding: 0,
            minHeight: 44,
            animationDelay: '0s',
          }}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="stagger-in" style={{ textAlign: 'center', marginBottom: 24, animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '2rem' }}>{opponent?.emoji}</span>
            <div>
              <div style={{ color: opponent?.color, fontWeight: 700, fontSize: '1rem' }}>{opponent?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{opponent?.class}</div>
            </div>
          </div>
          <p
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              lineHeight: 1.5,
              maxWidth: 300,
              margin: '0 auto',
            }}
          >
            &ldquo;{dialogue}&rdquo;
          </p>
        </div>

        {/* Gold and Bet display */}
        <div
          className="stagger-in"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            animationDelay: '0.1s',
          }}
        >
          <GoldDisplay amount={gold} />
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
            W: {wins} / L: {losses}
          </div>
        </div>

        {/* Bet selection */}
        <div
          className="stagger-in"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            textAlign: 'center',
            animationDelay: '0.15s',
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Place Your Bet
          </div>
          <div
            style={{
              color: '#c6a255',
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: "'SF Mono', 'Cascadia Code', ui-monospace, monospace",
              marginBottom: 16,
            }}
          >
            {bet}
            <span style={{ fontSize: '0.9rem', marginLeft: 4 }}>gold</span>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {betAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setBet(Math.min(amount, gold))}
                disabled={amount > gold}
                style={{
                  padding: '8px 16px',
                  borderRadius: 12,
                  border: `2px solid ${bet === Math.min(amount, gold) ? '#c6a255' : 'rgba(255,255,255,0.06)'}`,
                  background: bet === Math.min(amount, gold) ? 'rgba(198,162,85,0.15)' : 'rgba(255,255,255,0.03)',
                  color: amount > gold ? 'rgba(255,255,255,0.2)' : bet === Math.min(amount, gold) ? '#c6a255' : '#e8e8ef',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: amount > gold ? 'not-allowed' : 'pointer',
                  minHeight: 44,
                  fontFamily: "'SF Mono', 'Cascadia Code', ui-monospace, monospace",
                }}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startGame}
          className="stagger-in touch-target w-full py-3 font-semibold"
          style={{
            background: '#c6a255',
            color: '#fff',
            border: 'none',
            minHeight: 44,
            borderRadius: 9999,
            padding: '12px 24px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            animationDelay: '0.2s',
          }}
        >
          <Sparkles size={18} />
          Roll the Dice!
        </button>
      </AppShell>
    );
  }

  // PLAYING PHASES (rolling, player-select, rerolling, opponent-turn)
  if (phase === 'rolling' || phase === 'player-select' || phase === 'rerolling' || phase === 'opponent-turn') {
    const isPlayerTurn = phase === 'player-select';
    const isRerolling = phase === 'rerolling' || phase === 'opponent-turn';

    return (
      <AppShell title="Dice Poker">
        <button
          onClick={handleBackToSetup}
          className="touch-target stagger-in flex items-center gap-1 mb-4 rounded-lg"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--gold)',
            fontSize: '0.875rem',
            padding: 0,
            minHeight: 44,
            animationDelay: '0s',
          }}
        >
          <ArrowLeft size={18} />
          <span>Forfeit</span>
        </button>

        {/* Status bar */}
        <div
          className="stagger-in"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            animationDelay: '0.05s',
          }}
        >
          <GoldDisplay amount={gold} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1rem' }}>{opponent?.emoji}</span>
            <span style={{ color: opponent?.color, fontWeight: 600, fontSize: '0.8rem' }}>{opponent?.name}</span>
          </div>
        </div>

        {/* Bet display */}
        <div
          className="stagger-in"
          style={{
            textAlign: 'center',
            marginBottom: 16,
            padding: '8px 16px',
            borderRadius: 12,
            background: 'rgba(198,162,85,0.08)',
            border: '1px solid rgba(198,162,85,0.15)',
            animationDelay: '0.08s',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>BET</span>
          <span style={{ color: '#c6a255', fontWeight: 700, marginLeft: 8, fontFamily: 'monospace' }}>{bet} gold</span>
        </div>

        {/* Opponent's dice (face down) */}
        <div
          className="stagger-in"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            animationDelay: '0.1s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '1rem' }}>{opponent?.emoji}</span>
            <span style={{ color: opponent?.color, fontWeight: 600, fontSize: '0.8rem' }}>{opponent?.name}&apos;s Dice</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginLeft: 'auto' }}>
              {phase === 'opponent-turn' ? 'Rerolled!' : 'Hidden'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {(phase === 'opponent-turn' || phase === 'rerolling' ? opponentDice : [0, 0, 0, 0, 0]).map((value, i) => {
              const isKept = opponentKept.includes(i);
              return (
                <div
                  key={i}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    border: `2px solid ${isKept && phase === 'opponent-turn' ? opponent?.color ?? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
                    background: phase === 'opponent-turn'
                      ? isKept ? `${opponent?.color}15` : 'rgba(255,255,255,0.05)'
                      : 'rgba(255,255,255,0.03)',
                    color: phase === 'opponent-turn' ? (opponent?.color ?? '#e8e8ef') : 'rgba(255,255,255,0.2)',
                    fontSize: phase === 'opponent-turn' ? '0.95rem' : '0.7rem',
                    fontWeight: 700,
                    fontFamily: "'SF Mono', ui-monospace, monospace",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    lineHeight: 1,
                  }}
                >
                  <span style={{ fontSize: '0.5rem', opacity: 0.4, marginBottom: 1 }}>d20</span>
                  {phase === 'opponent-turn' ? value : '?'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Player's dice */}
        <div
          className="stagger-in"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            animationDelay: '0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '1rem' }}>🗡️</span>
            <span style={{ color: '#e8e8ef', fontWeight: 600, fontSize: '0.8rem' }}>Your Dice</span>
            {isPlayerTurn && (
              <span style={{ color: '#c6a255', fontSize: '0.7rem', marginLeft: 'auto' }}>
                Tap to keep
              </span>
            )}
          </div>
          <DiceDisplay
            dice={playerDice}
            keptIndices={playerKept}
            onToggle={isPlayerTurn ? handleToggleDie : undefined}
            rolling={rollingPhase && phase === 'rolling'}
            disabled={!isPlayerTurn}
          />
        </div>

        {/* Phase info / action */}
        <div
          className="stagger-in"
          style={{
            textAlign: 'center',
            marginBottom: 16,
            animationDelay: '0.2s',
          }}
        >
          {phase === 'rolling' && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Rolling dice...
            </p>
          )}
          {phase === 'player-select' && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 12 }}>
                Select dice to keep, then reroll the rest.
              </p>
              <button
                onClick={handleReroll}
                className="touch-target w-full py-3 font-semibold"
                style={{
                  background: '#c6a255',
                  color: '#fff',
                  border: 'none',
                  minHeight: 44,
                  borderRadius: 9999,
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <RotateCcw size={18} />
                Reroll ({5 - playerKept.length} dice)
              </button>
              <button
                onClick={() => {
                  // Keep all = don't reroll anything
                  setPlayerKept([0, 1, 2, 3, 4]);
                  setTimeout(() => handleReroll(), 50);
                }}
                className="touch-target w-full py-3 font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  minHeight: 44,
                  borderRadius: 9999,
                  padding: '12px 24px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Keep All Dice
              </button>
            </>
          )}
          {(phase === 'rerolling' || phase === 'opponent-turn') && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              {phase === 'rerolling' ? 'Rerolling...' : `${opponent?.name} is revealing their hand...`}
            </p>
          )}
        </div>
      </AppShell>
    );
  }

  // RESULT PHASE
  if (phase === 'result' && playerHand && opponentHand) {
    const resultColors: Record<string, { bg: string; border: string; text: string }> = {
      win: { bg: 'rgba(82,183,136,0.08)', border: 'rgba(82,183,136,0.3)', text: '#52b788' },
      lose: { bg: 'rgba(231,111,81,0.08)', border: 'rgba(231,111,81,0.3)', text: '#e76f51' },
      draw: { bg: 'rgba(198,162,85,0.08)', border: 'rgba(198,162,85,0.3)', text: '#c6a255' },
    };
    const rc = resultColors[resultMessage ?? 'draw'];
    const resultLabel = resultMessage === 'win' ? 'Victory!' : resultMessage === 'lose' ? 'Defeat' : 'Draw!';
    const goldChange = resultMessage === 'win' ? `+${bet}` : resultMessage === 'lose' ? `-${bet}` : '±0';

    return (
      <AppShell title="Dice Poker">
        <button
          onClick={handleBackToSetup}
          className="touch-target stagger-in flex items-center gap-1 mb-5 rounded-lg"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--gold)',
            fontSize: '0.875rem',
            padding: 0,
            minHeight: 44,
            animationDelay: '0s',
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Menu</span>
        </button>

        {/* Result Banner */}
        <div
          className="stagger-in"
          style={{
            background: rc.bg,
            border: `2px solid ${rc.border}`,
            borderRadius: 16,
            padding: '20px 16px',
            textAlign: 'center',
            marginBottom: 16,
            animationDelay: '0.05s',
          }}
        >
          <Trophy size={32} style={{ color: rc.text, marginBottom: 8 }} />
          <h2 className="font-heading" style={{ color: rc.text, fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px 0' }}>
            {resultLabel}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Coins size={14} style={{ color: '#c6a255' }} />
            <span style={{ color: '#c6a255', fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem' }}>{goldChange}</span>
          </div>
        </div>

        {/* Opponent's dice */}
        <div
          className="stagger-in"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            animationDelay: '0.1s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '1rem' }}>{opponent?.emoji}</span>
            <span style={{ color: opponent?.color, fontWeight: 600, fontSize: '0.8rem' }}>{opponent?.name}</span>
            <Badge
              label={opponentHand.rank}
              color={opponentHand.score >= 500 ? '#c6a255' : opponentHand.score >= 300 ? '#60a5fa' : 'rgba(255,255,255,0.5)'}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            {opponentDice.map((value, i) => (
              <div
                key={i}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  border: `2px solid ${opponentKept.includes(i) ? (opponent?.color ?? 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.06)'}`,
                  background: opponentKept.includes(i) ? `${opponent?.color}12` : 'rgba(255,255,255,0.03)',
                  color: opponent?.color ?? '#e8e8ef',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  fontFamily: "'SF Mono', ui-monospace, monospace",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: '0.5rem', opacity: 0.4, marginBottom: 1 }}>d20</span>
                {value}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
            {opponentHand.description}
          </div>
        </div>

        {/* Player's dice */}
        <div
          className="stagger-in"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            animationDelay: '0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '1rem' }}>🗡️</span>
            <span style={{ color: '#e8e8ef', fontWeight: 600, fontSize: '0.8rem' }}>You</span>
            <Badge
              label={playerHand.rank}
              color={playerHand.score >= 500 ? '#c6a255' : playerHand.score >= 300 ? '#60a5fa' : 'rgba(255,255,255,0.5)'}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            {playerDice.map((value, i) => (
              <div
                key={i}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  border: `2px solid ${playerKept.includes(i) ? '#c6a255' : 'rgba(255,255,255,0.06)'}`,
                  background: playerKept.includes(i) ? 'rgba(198,162,85,0.12)' : 'rgba(255,255,255,0.03)',
                  color: playerKept.includes(i) ? '#c6a255' : '#e8e8ef',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  fontFamily: "'SF Mono', ui-monospace, monospace",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: '0.5rem', opacity: 0.4, marginBottom: 1 }}>d20</span>
                {value}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
            {playerHand.description}
          </div>
        </div>

        {/* Dialogue */}
        <div
          className="stagger-in"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 16,
            animationDelay: '0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '1rem' }}>{opponent?.emoji}</span>
            <span style={{ color: opponent?.color, fontWeight: 600, fontSize: '0.8rem' }}>{opponent?.name}</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
            &ldquo;{dialogue}&rdquo;
          </p>
        </div>

        {/* Stats */}
        <div
          className="stagger-in"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            animationDelay: '0.25s',
          }}
        >
          <GoldDisplay amount={gold} />
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
            W: <span style={{ color: '#52b788', fontWeight: 600 }}>{wins}</span>
            {' / '}
            L: <span style={{ color: '#e76f51', fontWeight: 600 }}>{losses}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="stagger-in" style={{ animationDelay: '0.3s' }}>
          {gold > 0 ? (
            <button
              onClick={handleNewRound}
              className="touch-target w-full py-3 font-semibold"
              style={{
                background: '#c6a255',
                color: '#fff',
                border: 'none',
                minHeight: 44,
                borderRadius: 9999,
                padding: '12px 24px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Swords size={18} />
              Play Again ({bet} gold)
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                <Skull size={20} style={{ color: '#e76f51' }} />
                <span style={{ color: '#e76f51', fontWeight: 600, fontSize: '0.9rem' }}>Out of Gold!</span>
              </div>
              <button
                onClick={() => {
                  setGold(100);
                  setWins(0);
                  setLosses(0);
                  setPhase('setup');
                }}
                className="touch-target w-full py-3 font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e8e8ef',
                  border: '1px solid rgba(255,255,255,0.1)',
                  minHeight: 44,
                  borderRadius: 9999,
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={18} style={{ marginRight: 8 }} />
                Reset Game (100 gold)
              </button>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // Fallback
  return (
    <AppShell title="Dice Poker">
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
    </AppShell>
  );
}
