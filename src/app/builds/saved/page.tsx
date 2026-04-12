'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/Badge';
import { loadAllBuilds, deleteBuild } from '@/lib/build-storage';
import { races } from '@/data/races';
import { classes } from '@/data/classes';
import { backgrounds } from '@/data/backgrounds';
import type { SavedBuild } from '@/types';

export default function SavedBuildsPage() {
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllBuilds().then(b => {
      setBuilds(b.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string) {
    await deleteBuild(id);
    setBuilds(prev => prev.filter(b => b.id !== id));
  }

  return (
    <AppShell title="Saved Builds">
      <div className="mb-4 flex items-center justify-between">
        <BackButton href="/builds" />
        <Link
          href="/builds/new"
          className="px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--accent)', color: '#fff', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
        >
          + New Build
        </Link>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : builds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No builds yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Create your first character build</p>
          <Link
            href="/builds/new"
            className="px-6 py-3 rounded-xl font-semibold text-sm inline-block"
            style={{ background: 'var(--accent)', color: '#fff', minHeight: 44 }}
          >
            Create Build
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {builds.map(build => {
            const race = races.find(r => r.id === build.race);
            const bg = backgrounds.find(b => b.id === build.background);
            const usedClasses = [...new Set(build.levels.map(l => l.classId))];
            const classInfo = usedClasses.map(id => {
              const cls = classes.find(c => c.id === id)!;
              const count = build.levels.filter(l => l.classId === id).length;
              return `${cls.name} ${count}`;
            });

            return (
              <div
                key={build.id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{build.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge label={race?.name ?? build.race} color="#f59e0b" />
                      <Badge label={`Lv ${build.levels.length}`} color="#10b981" />
                      {classInfo.map(ci => <Badge key={ci} label={ci} color="#3b82f6" />)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(build.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: '#ef444422', color: '#ef4444', minHeight: 36 }}
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {bg?.name ?? build.background} · Updated {new Date(build.updatedAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
