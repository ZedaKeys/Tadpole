'use client';

import type { CSSProperties } from 'react';
import { classes } from '@/data/classes';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import styles from './builds.module.css';

const CLASS_COLORS: Record<string, string> = {
  barbarian: '#ef4444',
  bard: '#ec4899',
  cleric: '#fbbf24',
  druid: '#22c55e',
  fighter: '#6b7280',
  monk: '#8b5cf6',
  paladin: '#f59e0b',
  ranger: '#10b981',
  rogue: '#64748b',
  sorcerer: '#f97316',
  warlock: '#7c3aed',
  wizard: '#3b82f6',
};

function classStyle(classId: string): CSSProperties {
  return { '--class-color': CLASS_COLORS[classId] ?? 'var(--gold)' } as CSSProperties;
}

function badgeStyle(color: string): CSSProperties {
  return { '--badge-color': color } as CSSProperties;
}

function classSigil(name: string) {
  return name.slice(0, 2);
}

export default function BuildsPage() {
  return (
    <AppShell title="Build Planner">
      <div className={styles.page}>
        <section className={`${styles.commandDeck} stagger-in`} style={{ animationDelay: '0.02s' }}>
          <div className={styles.kicker}>Tactical command deck</div>
          <h2 className={styles.deckTitle}>Forge an Honour Mode doctrine.</h2>
          <p className={styles.deckCopy}>
            Compare the twelve core archetypes through a war-room lens: survivability, primary stat pressure,
            and the role each class brings to your party ledger.
          </p>

          <div className={styles.actions}>
            <Link
              href="/builds/new"
              className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
            >
              + New Build
            </Link>
            <Link
              href="/builds/saved"
              className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
            >
              Saved Builds
            </Link>
          </div>
        </section>

        <Link
          href="/builds/presets"
          className={`${styles.presetLink} stagger-in`}
          style={{ animationDelay: '0.1s' }}
        >
          <span className={styles.presetIcon} aria-hidden="true">⚔️</span>
          <span className={styles.presetText}>
            <span className={styles.presetTitle}>Preset Meta Builds</span>
            <span className={styles.presetSubtitle}>8 curated builds for Honour Mode</span>
          </span>
          <span className={styles.presetArrow} aria-hidden="true">›</span>
        </Link>

        <div className={`${styles.sectionHeader} stagger-in`} style={{ animationDelay: '0.14s' }}>
          <div>
            <p className={styles.sectionEyebrow}>Class matrix</p>
            <h3 className={styles.sectionTitle}>Choose your chassis</h3>
          </div>
          <div className={styles.classCount}>
            {classes.length} class{classes.length !== 1 ? 'es' : ''}
          </div>
        </div>

        <div className={styles.classGrid}>
          {classes.map((cls, i) => {
            const color = CLASS_COLORS[cls.id] ?? 'var(--gold)';

            return (
              <Link
                key={cls.id}
                href={`/builds/${cls.id}`}
                className={`${styles.classCard} stagger-in`}
                style={{ ...classStyle(cls.id), animationDelay: `${0.18 + i * 0.045}s` }}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardTopline}>
                    <span className={styles.classSigil} aria-hidden="true">
                      {classSigil(cls.name)}
                    </span>
                    <span className={styles.cardIndex}>#{String(i + 1).padStart(2, '0')}</span>
                  </div>

                  <h4 className={styles.className}>{cls.name}</h4>
                  <p className={styles.classDescription}>{cls.description}</p>

                  <div className={styles.badgeRow} aria-label={`${cls.name} build statistics`}>
                    <span className={styles.statBadge} style={badgeStyle(color)}>
                      <span className={styles.badgeLabel}>HD</span>
                      <span className={styles.badgeValue}>{cls.hitDie}</span>
                    </span>
                    <span className={styles.statBadge} style={badgeStyle('var(--gold-bright)')}>
                      <span className={styles.badgeLabel}>Ability</span>
                      <span className={styles.badgeValue}>{cls.primaryAbility}</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
