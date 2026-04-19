'use client';

import type { GameCharacter } from '@/types';
import SpellSlotGrid from './SpellSlotGrid';
import ActionResourcesPanel from './ActionResourcesPanel';
import ConditionMonitor from './ConditionMonitor';

interface SpellAndConditionsProps {
  host: GameCharacter | null;
  party: GameCharacter[];
}

export default function SpellAndConditions({ host, party }: SpellAndConditionsProps) {
  const allChars = host ? [host, ...party] : party;

  const hasAnySpellSlots = allChars.some((c) => c.spellSlots && Object.keys(c.spellSlots).length > 0);
  const hasAnyActionResources = allChars.some((c) => c.actionResources && c.actionResources.length > 0);
  const hasAnyConditions = allChars.some((c) => c.conditions && c.conditions.length > 0);

  if (!hasAnySpellSlots && !hasAnyActionResources && !hasAnyConditions) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      {(hasAnySpellSlots || hasAnyActionResources || hasAnyConditions) && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 8,
            display: 'block',
          }}
        >
          Spells & Resources
        </span>
      )}
      {allChars.map((c) => (
        <div key={c.guid}>
          <SpellSlotGrid character={c} />
          <ActionResourcesPanel character={c} />
          <ConditionMonitor character={c} />
        </div>
      ))}
    </div>
  );
}
