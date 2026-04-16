/**
 * build-image.ts — Renders a BG3 build as a shareable PNG card using the Canvas 2D API.
 *
 * No external dependencies. Works in all modern mobile browsers.
 */

import type { SavedBuild, AbilityType } from '@/types';
import { races } from '@/data/races';
import { classes } from '@/data/classes';
import { backgrounds } from '@/data/backgrounds';
import { feats } from '@/data/feats';
import { skills as allSkills } from '@/data/skills';

// ─── Constants ────────────────────────────────────────────────────────────────

const ABILITIES: AbilityType[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const ABILITY_SHORT: Record<AbilityType, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};

const W = 600;
const H = 900;
const PADDING = 36;

// Colors
const BG_DARK = '#0f0f14';
const BG_CARD = '#1a1a24';
const GOLD = '#d4a44a';
const GOLD_BRIGHT = '#f5c842';
const GOLD_DIM = '#8b7232';
const TEXT_PRIMARY = '#e8e4dc';
const TEXT_SECONDARY = '#9a9590';
const ACCENT_BLUE = '#4a90d9';
const ACCENT_GREEN = '#3cb371';
const ACCENT_PURPLE = '#7c5cbf';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function modifier(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

function getRacialBonuses(raceId: string, subraceId?: string): Record<AbilityType, number> {
  const race = races.find(r => r.id === raceId);
  if (!race) return {} as Record<AbilityType, number>;
  const bonuses: Partial<Record<AbilityType, number>> = {};
  for (const b of race.abilityBonuses) bonuses[b.ability] = (bonuses[b.ability] ?? 0) + b.bonus;
  if (subraceId) {
    const sub = race.subraces.find(s => s.id === subraceId);
    if (sub) for (const b of sub.abilityBonuses) bonuses[b.ability] = (bonuses[b.ability] ?? 0) + b.bonus;
  }
  return bonuses as Record<AbilityType, number>;
}

function getFeatAsiBonuses(choice: { featId: string; asiBoosts?: { ability: AbilityType; amount: number }[] }): Record<AbilityType, number> {
  const result: Partial<Record<AbilityType, number>> = {};
  if (choice.asiBoosts) {
    for (const b of choice.asiBoosts) {
      result[b.ability] = (result[b.ability] ?? 0) + b.amount;
    }
  }
  return result as Record<AbilityType, number>;
}

// ─── Canvas drawing primitives ────────────────────────────────────────────────

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawBadge(ctx: CanvasRenderingContext2D, text: string, color: string, x: number, y: number, fontSize: number = 13): number {
  const padH = 10;
  const padV = 5;
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  const metrics = ctx.measureText(text);
  const bw = metrics.width + padH * 2;
  const bh = fontSize + padV * 2;
  // Badge background
  ctx.fillStyle = color + '25'; // 15% opacity
  drawRoundRect(ctx, x, y, bw, bh, bh / 2);
  ctx.fill();
  // Border
  ctx.strokeStyle = color + '60';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, x, y, bw, bh, bh / 2);
  ctx.stroke();
  // Text
  ctx.fillStyle = color;
  ctx.fillText(text, x + padH, y + padV + fontSize - 2);
  return bw;
}

function drawGoldDivider(ctx: CanvasRenderingContext2D, y: number) {
  const gradient = ctx.createLinearGradient(PADDING, y, W - PADDING, y);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.2, GOLD_DIM + '60');
  gradient.addColorStop(0.5, GOLD + '80');
  gradient.addColorStop(0.8, GOLD_DIM + '60');
  gradient.addColorStop(1, 'transparent');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(W - PADDING, y);
  ctx.stroke();
}

function drawSectionTitle(ctx: CanvasRenderingContext2D, y: number, emoji: string, title: string): number {
  ctx.font = `700 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.fillText(`${emoji}  ${title}`, PADDING, y);
  drawGoldDivider(ctx, y + 10);
  return y + 28;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number = 3): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines) break;
    } else {
      line = testLine;
    }
  }
  if (lineCount < maxLines) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface BuildImageOptions {
  build: SavedBuild;
}

export async function renderBuildToBlob(options: BuildImageOptions): Promise<Blob> {
  const { build } = options;

  // Resolve references
  const race = races.find(r => r.id === build.race);
  const subrace = race?.subraces.find(s => s.id === build.subrace);
  const bg = backgrounds.find(b => b.id === build.background);

  const usedClassIds = [...new Set(build.levels.map(l => l.classId))];
  const classBreakdown = usedClassIds.map(id => {
    const cls = classes.find(c => c.id === id);
    const count = build.levels.filter(l => l.classId === id).length;
    const sub = build.levels.find(l => l.classId === id && l.subclassId);
    const subclassObj = cls?.subclasses.find(sc => sc.id === sub?.subclassId);
    return { id, cls, count, subclassObj };
  });

  const racialBonuses = getRacialBonuses(build.race, build.subrace || undefined);

  const featAsiTotals: Partial<Record<AbilityType, number>> = {};
  for (const fc of build.featChoices) {
    const bonuses = getFeatAsiBonuses(fc);
    for (const [ability, amount] of Object.entries(bonuses)) {
      featAsiTotals[ability as AbilityType] = (featAsiTotals[ability as AbilityType] ?? 0) + amount;
    }
  }

  const finalScores: Record<AbilityType, number> = {} as Record<AbilityType, number>;
  for (const ability of ABILITIES) {
    finalScores[ability] = build.baseScores[ability] + (racialBonuses[ability] ?? 0) + (featAsiTotals[ability] ?? 0);
  }

  const resolvedFeats = build.featChoices
    .map(fc => ({ ...fc, feat: feats.find(f => f.id === fc.featId) }))
    .filter(fc => fc.featId !== 'asi');

  // ─── Create canvas ────────────────────────────────────────────────────────

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#12121a');
  bgGrad.addColorStop(0.5, '#0f0f14');
  bgGrad.addColorStop(1, '#0a0a10');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Gold accent border
  ctx.strokeStyle = GOLD + '40';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 8, 8, W - 16, H - 16, 16);
  ctx.stroke();

  // Inner subtle glow at top
  const topGlow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.6);
  topGlow.addColorStop(0, GOLD + '10');
  topGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 200);

  // ─── Header area ──────────────────────────────────────────────────────────

  let y = 36;

  // Build name
  ctx.font = `800 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.textAlign = 'left';
  ctx.fillText(build.name.length > 28 ? build.name.slice(0, 26) + '…' : build.name, PADDING, y + 26);

  y += 44;

  // Subtitle: Race + Subrace + Level
  const subtitleParts: string[] = [];
  if (race) subtitleParts.push(race.name);
  if (subrace) subtitleParts.push(subrace.name);
  subtitleParts.push(`Level ${build.levels.length}`);
  const subtitle = subtitleParts.join('  ·  ');

  ctx.font = `500 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.fillText(subtitle, PADDING, y);

  y += 20;

  // Class badges row
  ctx.font = `600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  let bx = PADDING;
  for (const { cls, count } of classBreakdown) {
    if (!cls) continue;
    const label = `${cls.name} ${count}`;
    const bw = drawBadge(ctx, label, ACCENT_BLUE, bx, y, 13);
    bx += bw + 8;
  }
  if (bg) {
    drawBadge(ctx, bg.name, ACCENT_PURPLE, bx, y, 13);
  }

  y += 34;

  // Gold divider
  drawGoldDivider(ctx, y);
  y += 18;

  // ─── Ability Scores Section ───────────────────────────────────────────────

  y = drawSectionTitle(ctx, y, '⚔️', 'Ability Scores');
  y += 4;

  // 3x2 grid
  const gridCols = 3;
  const gridGap = 12;
  const cellW = (W - PADDING * 2 - gridGap * (gridCols - 1)) / gridCols;
  const cellH = 62;

  for (let i = 0; i < ABILITIES.length; i++) {
    const ability = ABILITIES[i];
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    const cx = PADDING + col * (cellW + gridGap);
    const cy = y + row * (cellH + gridGap);

    // Cell background
    ctx.fillStyle = BG_CARD;
    drawRoundRect(ctx, cx, cy, cellW, cellH, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffffff0f';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, cx, cy, cellW, cellH, 10);
    ctx.stroke();

    // Ability short name
    ctx.font = `700 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center';
    ctx.fillText(ABILITY_SHORT[ability], cx + cellW / 2, cy + 16);

    // Score
    const total = finalScores[ability];
    ctx.font = `800 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.fillText(`${total}`, cx + cellW / 2, cy + 40);

    // Modifier
    ctx.font = `600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.fillText(modifier(total), cx + cellW / 2, cy + 56);

    ctx.textAlign = 'left';
  }

  y += 2 * (cellH + gridGap) + 14;

  // ─── Class Spread Section ─────────────────────────────────────────────────

  y = drawSectionTitle(ctx, y, '🗡️', 'Class Spread');
  y += 4;

  for (const { cls, count, subclassObj } of classBreakdown) {
    if (!cls) continue;

    // Card background
    const cardH = subclassObj ? 56 : 36;
    ctx.fillStyle = BG_CARD;
    drawRoundRect(ctx, PADDING, y, W - PADDING * 2, cardH, 10);
    ctx.fill();

    // Left gold accent bar
    ctx.fillStyle = GOLD;
    drawRoundRect(ctx, PADDING, y, 3, cardH, 1.5);
    ctx.fill();

    // Class name
    ctx.font = `700 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.fillText(cls.name, PADDING + 14, y + 16);

    // Level count
    ctx.font = `600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = ACCENT_BLUE;
    ctx.fillText(`${count} level${count !== 1 ? 's' : ''}`, PADDING + 14, y + 32);

    // Hit die on right
    ctx.font = `500 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.textAlign = 'right';
    ctx.fillText(`${cls.hitDie} Hit Die`, W - PADDING - 10, y + 16);
    ctx.textAlign = 'left';

    if (subclassObj) {
      ctx.font = `600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = GOLD_DIM;
      ctx.fillText(`Subclass: `, PADDING + 14, y + 48);
      const subX = PADDING + 14 + ctx.measureText('Subclass: ').width;
      ctx.fillStyle = TEXT_PRIMARY;
      ctx.fillText(subclassObj.name, subX, y + 48);
    }

    y += cardH + 8;
  }

  y += 6;

  // ─── Feats Section ────────────────────────────────────────────────────────

  if (resolvedFeats.length > 0) {
    y = drawSectionTitle(ctx, y, '✨', 'Key Feats');
    y += 2;

    // Show up to 5 feats
    const shownFeats = resolvedFeats.slice(0, 5);
    for (const fc of shownFeats) {
      const featName = fc.feat?.name ?? fc.featId;
      ctx.font = `600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.fillText(featName, PADDING + 4, y);

      // Level badge on right
      ctx.font = `600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillStyle = TEXT_SECONDARY;
      ctx.fillText(`Lv ${fc.atLevel}`, W - PADDING - 8, y);
      ctx.textAlign = 'left';

      // Truncated description
      if (fc.feat?.description) {
        y += 16;
        ctx.font = `400 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.fillStyle = TEXT_SECONDARY;
        const desc = fc.feat.description.length > 80 ? fc.feat.description.slice(0, 77) + '...' : fc.feat.description;
        ctx.fillText(desc, PADDING + 4, y);
      }

      y += 18;
    }

    if (resolvedFeats.length > 5) {
      ctx.font = `500 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = TEXT_SECONDARY;
      ctx.fillText(`+${resolvedFeats.length - 5} more`, PADDING + 4, y);
      y += 16;
    }
  }

  y += 6;

  // ─── Skills Section ───────────────────────────────────────────────────────

  if (build.chosenSkills.length > 0) {
    y = drawSectionTitle(ctx, y, '🎯', 'Skills');
    y += 4;

    const maxSkills = Math.min(build.chosenSkills.length, 8);
    let sx = PADDING;
    ctx.font = `600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

    for (let i = 0; i < maxSkills; i++) {
      const skillName = build.chosenSkills[i];
      const bw = drawBadge(ctx, skillName, ACCENT_GREEN, sx, y, 11);
      sx += bw + 6;
      if (sx > W - PADDING - 80) {
        sx = PADDING;
        y += 24;
      }
    }

    y += 22;
  }

  // ─── Footer ───────────────────────────────────────────────────────────────

  // Bottom gradient fade
  const footerY = H - 50;
  const footerGrad = ctx.createLinearGradient(0, footerY, 0, H);
  footerGrad.addColorStop(0, 'transparent');
  footerGrad.addColorStop(1, '#0a0a1080');
  ctx.fillStyle = footerGrad;
  ctx.fillRect(0, footerY, W, 50);

  ctx.font = `500 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.fillStyle = GOLD_DIM;
  ctx.textAlign = 'center';
  ctx.fillText('Tadpole — BG3 Build Planner', W / 2, H - 24);
  ctx.textAlign = 'left';

  // ─── Export as blob ───────────────────────────────────────────────────────

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob'));
      },
      'image/png',
      1.0,
    );
  });
}

/**
 * Convenience: renders build to a PNG Blob and triggers a browser download.
 */
export async function exportBuildImage(build: SavedBuild): Promise<void> {
  const blob = await renderBuildToBlob({ build });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${build.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
