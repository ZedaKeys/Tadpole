'use client';

import { useState } from 'react';
import { useGameConnection } from '@/hooks/useGameConnection';
import { AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const QUICK_BUFFS = [
  { id: 'BLESS', name: 'Bless' },
  { id: 'HASTE', name: 'Haste' },
  { id: 'INVISIBILITY', name: 'Invisibility' },
  { id: 'MIRROR_IMAGE', name: 'Mirror Image' },
  { id: 'FLY', name: 'Fly' },
  { id: 'FREEDOM_OF_MOVEMENT', name: 'FoM' },
  { id: 'LONGSTRIDER', name: 'Longstrider' },
  { id: 'RESIST_FIRE', name: 'Fire Res' },
];

const QUICK_ITEMS = [
  { id: 'WPN_Potion_Healing_001', name: 'Heal Potion' },
  { id: 'WPN_Potion_Healing_Greater_001', name: 'Greater Heal' },
  { id: 'WPN_Potion_Speed_001', name: 'Speed Potion' },
  { id: 'WPN_Potion_Invisibility_001', name: 'Invis Potion' },
];

const LEVEL_PRESETS = [1, 4, 8, 12];
const GOLD_PRESETS = [100, 500, 1000, 5000];

export default function CheatsPage() {
  const { isConnected, sendCommand } = useGameConnection();
  const [goldAmount, setGoldAmount] = useState('500');
  const [setLevel, setSetLevel] = useState('12');
  const [lastAction, setLastAction] = useState('');

  const send = (action: string, extra: Record<string, unknown> = {}) => {
    sendCommand({ action, ...extra });
    setLastAction(action);
    setTimeout(() => setLastAction(''), 2000);
  };

  if (!isConnected) {
    return (
      <AppShell title="Cheats">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '48px 20px', textAlign: 'center',
          color: 'var(--text-3)',
        }}>
          <AlertCircle size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-2)' }}>Connect to your game first</p>
          <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Go to the Live tab to connect</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Cheats">
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 100px' }}>

        {lastAction && (
          <div style={{
            padding: '8px 12px', marginBottom: 16,
            border: '1px solid var(--accent)',
            borderRadius: 8, background: 'rgba(91,138,255,0.08)',
            color: 'var(--accent)', fontSize: '0.8rem', fontFamily: 'monospace',
          }}>
            Sent: {lastAction}
          </div>
        )}

        {/* Character */}
        <section className="cheat-section">
          <h2 className="cheat-section-title">Character</h2>
          <div className="cheat-grid-2">
            <button className="btn" onClick={() => send('heal_party')}>Heal Party</button>
            <button className="btn" onClick={() => send('revive')}>Revive All</button>
            <button className="btn" style={{ gridColumn: 'span 2' }} onClick={() => send('full_restore')}>
              Full Restore
            </button>
          </div>
        </section>

        {/* Set Level */}
        <section className="cheat-section">
          <h2 className="cheat-section-title">Set Level</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input
              type="number"
              value={setLevel}
              onChange={(e) => setSetLevel(e.target.value)}
              className="input"
              min="1" max="12"
              style={{ width: 80, textAlign: 'center' }}
            />
            <button className="btn btn-primary" onClick={() => send('set_level', { level: parseInt(setLevel) })}>
              Apply
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {LEVEL_PRESETS.map((lvl) => (
              <button key={lvl} className="btn btn-sm" onClick={() => { setSetLevel(String(lvl)); send('set_level', { level: lvl }); }}>
                Level {lvl}
              </button>
            ))}
          </div>
        </section>

        {/* Gold */}
        <section className="cheat-section">
          <h2 className="cheat-section-title">Gold</h2>
          <div className="cheat-input-row">
            <input
              type="number"
              value={goldAmount}
              onChange={(e) => setGoldAmount(e.target.value)}
              className="input"
              min="0"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={() => send('add_gold', { amount: parseInt(goldAmount) || 0 })}>
              Add
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {GOLD_PRESETS.map((amt) => (
              <button key={amt} className="btn btn-sm" onClick={() => { setGoldAmount(String(amt)); send('add_gold', { amount: amt }); }}>
                +{amt}
              </button>
            ))}
          </div>
        </section>

        {/* Buffs */}
        <section className="cheat-section">
          <h2 className="cheat-section-title">Buffs</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_BUFFS.map(({ id, name }) => (
              <button key={id} className="btn btn-sm" onClick={() => send('apply_buff', { buff: id })}>
                {name}
              </button>
            ))}
          </div>
        </section>

        {/* Items */}
        <section className="cheat-section">
          <h2 className="cheat-section-title">Items</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_ITEMS.map(({ id, name }) => (
              <button key={id} className="btn btn-sm" onClick={() => send('spawn_item', { itemId: id })}>
                {name}
              </button>
            ))}
          </div>
        </section>

      </div>
    </AppShell>
  );
}