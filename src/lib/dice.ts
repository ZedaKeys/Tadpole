interface DiceRoll {
  count: number;
  sides: number;
  modifier: number;
}

interface DiceStatistics {
  min: number;
  max: number;
  average: number;
  notation: string;
}

/**
 * Parse dice notation like "2d6+3", "1d20", "4d8-2"
 */
function parseDiceNotation(notation: string): DiceRoll {
  const normalized = notation.replace(/\s/g, '').toLowerCase();
  const match = normalized.match(/^(\d+)d(\d+)([+-]\d+)?$/);

  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
}

/**
 * Simulate a single dice roll (for utility/testing)
 */
function rollDice(notation: string): number {
  const dice = parseDiceNotation(notation);
  let total = 0;
  for (let i = 0; i < dice.count; i++) {
    total += Math.floor(Math.random() * dice.sides) + 1;
  }
  return total + dice.modifier;
}

/**
 * Calculate probability of meeting or exceeding a DC.
 * Uses exact combinatorics for small dice pools, Monte Carlo for large ones.
 */
function calculateProbability(
  dice: DiceRoll,
  dc: number,
  modifier: number = 0,
  mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
): number {
  const target = dc - dice.modifier - modifier;

  if (dice.count === 1) {
    // Simple probability for single die
    const successOutcomes = Math.max(0, dice.sides - target + 1);
    const p = Math.min(1, Math.max(0, successOutcomes / dice.sides));

    if (mode === 'advantage') return 1 - Math.pow(1 - p, 2);
    if (mode === 'disadvantage') return Math.pow(p, 2);
    return p;
  }

  // For multiple dice, use Monte Carlo simulation
  const simulations = 50_000;
  let successes = 0;

  for (let s = 0; s < simulations; s++) {
    const roll = simulateSingleRoll(dice, mode);
    if (roll >= target) successes++;
  }

  return successes / simulations;
}

function simulateSingleRoll(dice: DiceRoll, mode: 'normal' | 'advantage' | 'disadvantage'): number {
  function singleAttempt(): number {
    let total = 0;
    for (let i = 0; i < dice.count; i++) {
      total += Math.floor(Math.random() * dice.sides) + 1;
    }
    return total;
  }

  if (dice.count === 1 && mode !== 'normal') {
    const a = singleAttempt();
    const b = singleAttempt();
    return mode === 'advantage' ? Math.max(a, b) : Math.min(a, b);
  }

  return singleAttempt();
}

/**
 * Get statistical info about a dice roll
 */
function getDiceStatistics(notation: string): DiceStatistics {
  const dice = parseDiceNotation(notation);

  return {
    min: dice.count * 1 + dice.modifier,
    max: dice.count * dice.sides + dice.modifier,
    average: dice.count * (dice.sides + 1) / 2 + dice.modifier,
    notation,
  };
}

export { rollDice, calculateProbability, getDiceStatistics, parseDiceNotation };
export type { DiceRoll, DiceStatistics };
