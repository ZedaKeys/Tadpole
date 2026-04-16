'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/Badge';
import { loadAllBuilds, deleteBuild } from '@/lib/build-storage';
import { getSharePath } from '@/lib/build-share';
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

  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    await deleteBuild(id);
    setBuilds(prev => prev.filter(b => b.id !== id));
  }

  const handleShare = useCallback(async (build: SavedBuild) => {
    const sharePath = getSharePath(build);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + '/phone' : '';
    const fullUrl = `${baseUrl}${sharePath}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(build.id);
      setTimeout(() => setCopiedId(prev => prev === build.id ? null : prev), 2000);
    } catch {
      // Fallback: create a temporary input
      const input = document.createElement('input');
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedId(build.id);
      setTimeout(() => setCopiedId(prev => prev === build.id ? null : prev), 2000);
    }
  }, []);

  return (
    <AppShell title="Saved Builds">
      <div className="stagger-in mb-5 flex items-center justify-between" style={{ animationDelay: '0s' }}>
        <BackButton href="/builds" />
        <Link
          href="/builds/new"
          className="font-semibold text-sm"
          style={{ background: 'var(--gold)', color: '#fff', minHeight: 44, display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '12px 24px' }}
        >
          + New Build
        </Link>
      </div>

      {loading ? (
        <p className="stagger-in text-sm" style={{ color: 'var(--text-secondary)', animationDelay: '0.1s' }}>Loading...</p>
      ) : builds.length === 0 ? (
        <div className="stagger-in text-center py-12" style={{ animationDelay: '0.1s' }}>
          <p className="font-heading text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>No builds yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Create your first character build</p>
          <Link
            href="/builds/new"
            className="font-semibold text-sm inline-block"
            style={{ background: 'var(--gold)', color: '#fff', minHeight: 44, borderRadius: 9999, padding: '12px 24px' }}
          >
            Create Build
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {builds.map((build, index) => {
            const race = races.find(r => r.id === build.race);
            const bg = backgrounds.find(b => b.id === build.background);
            const usedClasses = [...new Set(build.levels.map(l => l.classId))];
            const classInfo = usedClasses.map(id => {
              const cls = classes.find(c => c.id === id)!;
              const count = build.levels.filter(l => l.classId === id).length;
              return `${cls.name} ${count}`;
            });

            return (
              <Link
                key={build.id}
                href={`/builds/view?id=${build.id}`}
                className="stagger-in p-4 block"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, animationDelay: `${0.1 + index * 0.08}s`, textDecoration: 'none' }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{build.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge label={race?.name ?? build.race} color="#f59e0b" />
                      <Badge label={`Lv ${build.levels.length}`} color="#10b981" />
                      {classInfo.map(ci => <Badge key={ci} label={ci} color="#3b82f6" />)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); handleShare(build); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: copiedId === build.id ? '#10b98122' : 'rgba(59, 130, 246, 0.15)', color: copiedId === build.id ? '#10b981' : '#3b82f6', minHeight: 32 }}
                  >
                    {copiedId === build.id ? 'Copied!' : 'Share'}
                  </button>
                  <Link
                    href={`/builds/new?edit=${build.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', minHeight: 32 }}
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(build.id); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: '#ef444422', color: '#ef4444', minHeight: 32 }}
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {bg?.name ?? build.background} · Updated {new Date(build.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
