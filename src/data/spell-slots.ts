import type { SpellSlotRow } from '@/types';

/**
 * Full caster spell slot progression (levels 1–12).
 * Used for Bard, Cleric, Druid, Sorcerer, and Wizard.
 * Standard 5e table capped at level 12.
 * slots = [cantrips, 1st, 2nd, 3rd, 4th, 5th, 6th]
 */
export const fullCasterTable: SpellSlotRow[] = [
  { level: 1,  slots: [2, 2, 0, 0, 0, 0, 0] },
  { level: 2,  slots: [2, 3, 0, 0, 0, 0, 0] },
  { level: 3,  slots: [2, 4, 2, 0, 0, 0, 0] },
  { level: 4,  slots: [3, 4, 3, 0, 0, 0, 0] },
  { level: 5,  slots: [3, 4, 3, 2, 0, 0, 0] },
  { level: 6,  slots: [3, 4, 3, 3, 0, 0, 0] },
  { level: 7,  slots: [3, 4, 3, 3, 1, 0, 0] },
  { level: 8,  slots: [3, 4, 3, 3, 2, 0, 0] },
  { level: 9,  slots: [3, 4, 3, 3, 3, 1, 0] },
  { level: 10, slots: [4, 4, 3, 3, 3, 2, 0] },
  { level: 11, slots: [4, 4, 3, 3, 3, 2, 1] },
  { level: 12, slots: [4, 4, 3, 3, 3, 2, 1] },
];

/**
 * Half caster spell slot progression (levels 1–12).
 * Used for Paladin and Ranger.
 * Derived from full caster table at caster level = ceil(classLevel / 2).
 * Paladins and Rangers do not gain spell slots until class level 2.
 * slots = [cantrips, 1st, 2nd, 3rd, 4th, 5th, 6th]
 */
export const halfCasterTable: SpellSlotRow[] = [
  { level: 1,  slots: [0, 0, 0, 0, 0, 0, 0] },
  { level: 2,  slots: [0, 2, 0, 0, 0, 0, 0] },
  { level: 3,  slots: [0, 3, 0, 0, 0, 0, 0] },
  { level: 4,  slots: [0, 3, 0, 0, 0, 0, 0] },
  { level: 5,  slots: [0, 4, 2, 0, 0, 0, 0] },
  { level: 6,  slots: [0, 4, 2, 0, 0, 0, 0] },
  { level: 7,  slots: [0, 4, 3, 0, 0, 0, 0] },
  { level: 8,  slots: [0, 4, 3, 0, 0, 0, 0] },
  { level: 9,  slots: [0, 4, 3, 2, 0, 0, 0] },
  { level: 10, slots: [0, 4, 3, 2, 0, 0, 0] },
  { level: 11, slots: [0, 4, 3, 3, 0, 0, 0] },
  { level: 12, slots: [0, 4, 3, 3, 0, 0, 0] },
];

/**
 * Warlock pact magic spell slot progression (levels 1–12).
 * All warlock slots are the same level and recharge on a short rest.
 * slots = [cantrips, 1st, 2nd, 3rd, 4th, 5th, 6th]
 *
 * Slot level progression:
 *   L1:  1 slot @ 1st   L5:  2 slots @ 3rd   L9:  2 slots @ 5th
 *   L2:  2 slots @ 1st  L6:  2 slots @ 3rd   L10: 2 slots @ 5th
 *   L3:  2 slots @ 2nd  L7:  2 slots @ 4th   L11: 3 slots @ 5th
 *   L4:  2 slots @ 2nd  L8:  2 slots @ 4th   L12: 3 slots @ 5th
 */
export const warlockTable: SpellSlotRow[] = [
  { level: 1,  slots: [2, 1, 0, 0, 0, 0, 0] },
  { level: 2,  slots: [2, 2, 0, 0, 0, 0, 0] },
  { level: 3,  slots: [2, 0, 2, 0, 0, 0, 0] },
  { level: 4,  slots: [3, 0, 2, 0, 0, 0, 0] },
  { level: 5,  slots: [3, 0, 0, 2, 0, 0, 0] },
  { level: 6,  slots: [3, 0, 0, 2, 0, 0, 0] },
  { level: 7,  slots: [3, 0, 0, 0, 2, 0, 0] },
  { level: 8,  slots: [3, 0, 0, 0, 2, 0, 0] },
  { level: 9,  slots: [3, 0, 0, 0, 0, 2, 0] },
  { level: 10, slots: [4, 0, 0, 0, 0, 2, 0] },
  { level: 11, slots: [4, 0, 0, 0, 0, 3, 0] },
  { level: 12, slots: [4, 0, 0, 0, 0, 3, 0] },
];

// ── Multiclass helpers ───────────────────────────────────────────────

const FULL_CASTER_IDS = new Set([
  'bard',
  'cleric',
  'druid',
  'sorcerer',
  'wizard',
]);

const HALF_CASTER_IDS = new Set([
  'paladin',
  'ranger',
]);

/**
 * Calculate combined spell slots for a multiclassed character.
 *
 * – Full casters (Bard, Cleric, Druid, Sorcerer, Wizard) contribute their
 *   full class level toward the effective caster level.
 * – Half casters (Paladin, Ranger) contribute floor(level / 3) toward the
 *   effective caster level.
 * – Warlock levels are tracked separately (pact magic does not mix with
 *   the standard spellcasting pool).
 *
 * The returned `slots` array is looked up from the full caster table at the
 * combined effective caster level (capped at 12).  `warlockSlots` describes
 * the pact‑magic slots independently.
 */
export function getMulticlassSpellSlots(
  classLevels: { classId: string; level: number }[],
): { slots: number[]; warlockSlots: { count: number; level: number } } {
  let effectiveCasterLevel = 0;
  let warlockLevel = 0;

  for (const { classId, level } of classLevels) {
    const id = classId.toLowerCase();
    if (FULL_CASTER_IDS.has(id)) {
      effectiveCasterLevel += level;
    } else if (HALF_CASTER_IDS.has(id)) {
      effectiveCasterLevel += Math.floor(level / 3);
    } else if (id === 'warlock') {
      warlockLevel += level;
    }
  }

  // Standard spell slots from the full caster table (capped at 12)
  const cappedLevel = Math.min(Math.max(effectiveCasterLevel, 0), 12);
  const emptySlots = [0, 0, 0, 0, 0, 0, 0] as number[];
  const slots: number[] =
    cappedLevel > 0
      ? [...fullCasterTable[cappedLevel - 1].slots]
      : emptySlots;

  // Warlock pact‑magic slots (independent pool)
  let warlockSlots = { count: 0, level: 0 };
  if (warlockLevel > 0) {
    const wlRow = warlockTable[Math.min(warlockLevel, 12) - 1];
    for (let i = 1; i < wlRow.slots.length; i++) {
      if (wlRow.slots[i] > 0) {
        warlockSlots = { count: wlRow.slots[i], level: i };
        break;
      }
    }
  }

  return { slots, warlockSlots };
}
