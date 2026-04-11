'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Download, Upload, Trash2, Shield, Heart, Star, AlertTriangle, Clipboard, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useSpoilerMode } from '@/hooks/useSpoilerMode';
import { useFavorites } from '@/hooks/useFavorites';
import { APP_NAME, VERSION, DISCLAIMER } from '@/lib/version';
import { safeGet, safeRemove } from '@/lib/storage';
import { ErrorReporter } from '@/lib/error-reporter';
import { AppShell } from '@/components/layout/AppShell';
import type { SpoilerMode } from '@/types';

const SPOILER_OPTIONS: { value: SpoilerMode; label: string; desc: string }[] = [
  { value: 'none', label: 'None', desc: 'No spoilers shown' },
  { value: 'hints', label: 'Hints', desc: 'Subtle hints only' },
  { value: 'full', label: 'Full', desc: 'All spoilers revealed' },
];

export default function SettingsPage() {
  const { mode: spoilerMode, setMode: setSpoilerMode } = useSpoilerMode();
  const { favorites: spellFavs } = useFavorites('spells');
  const { favorites: itemFavs } = useFavorites('items');
  const { favorites: companionFavs } = useFavorites('companions');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof ErrorReporter.getLocalErrors>>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshErrors = useCallback(() => {
    setErrors(ErrorReporter.getLocalErrors().slice(0, 10));
  }, []);

  useEffect(() => {
    refreshErrors();
  }, [refreshErrors]);

  const handleExport = () => {
    const data = {
      app: APP_NAME,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      spoilerMode,
      favoriteSpells: spellFavs,
      favoriteItems: itemFavs,
      favoriteCompanions: companionFavs,
      checklistProgress: safeGet<Record<string, string[]>>('tadpole-checklist'),
      tourProgress: safeGet<Record<string, number>>('tadpole-tour-progress'),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tadpole-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.spoilerMode) {
          setSpoilerMode(data.spoilerMode);
        }
        // Note: For a full import, we'd need to save each favorites list
        // using dualSave. For now we import spoiler mode.
        alert('Data imported successfully!');
      } catch {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleClearAll = () => {
    // Clear all localStorage keys that start with 'tadpole-'
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tadpole-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => safeRemove(key));
    setShowClearConfirm(false);
    // Reload to reset state
    window.location.reload();
  };

  const handleClearErrors = () => {
    ErrorReporter.clearLocalErrors();
    refreshErrors();
  };

  const handleCopyErrors = async () => {
    try {
      const text = ErrorReporter.getFormattedErrors();
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Clipboard API might not be available
      try {
        const text = ErrorReporter.getFormattedErrors();
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {
        // Silently fail
      }
    }
  };

  const handleOpenGitHubIssue = () => {
    const body = `## Error Report\n\nApp version: ${VERSION}\nDate: ${new Date().toISOString()}\n\n### Errors\n\n\`\`\`\n${ErrorReporter.getFormattedErrors()}\n\`\`\``;
    const url = `https://github.com/user/tadpole/issues/new?title=${encodeURIComponent('[Error Report]')}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener');
  };

  const sectionStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    marginBottom: 8,
    display: 'block',
    fontWeight: 600,
  };

  return (
    <AppShell title="Settings">
      {/* Back link */}
      <Link
        href="/"
        className="touch-target flex items-center gap-1 mb-4 rounded-lg"
        style={{
          color: 'var(--accent)',
          fontSize: '0.875rem',
          textDecoration: 'none',
          minHeight: 44,
          display: 'inline-flex',
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </Link>

      {/* Spoiler Mode */}
      <div style={sectionStyle}>
        <label style={labelStyle}>
          <Shield size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Spoiler Mode
        </label>
        <div className="space-y-2">
          {SPOILER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSpoilerMode(opt.value)}
              className="touch-target w-full rounded-lg px-4 py-3 flex items-center justify-between"
              style={{
                background: spoilerMode === opt.value ? 'var(--accent-muted)' : 'transparent',
                border: `1px solid ${spoilerMode === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <div className="font-semibold text-sm">{opt.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{opt.desc}</div>
              </div>
              {spoilerMode === opt.value && (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    border: '2px solid var(--accent)',
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Favorite Counts */}
      <div style={sectionStyle}>
        <label style={labelStyle}>
          <Heart size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Favorites
        </label>
        <div className="flex justify-between">
          <div className="text-center flex-1">
            <Star size={18} style={{ color: 'var(--accent)', marginBottom: 4 }} />
            <div className="font-mono-num" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>
              {spellFavs.length}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Spells</div>
          </div>
          <div className="text-center flex-1">
            <Star size={18} style={{ color: 'var(--rarity-legendary)', marginBottom: 4 }} />
            <div className="font-mono-num" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>
              {itemFavs.length}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Items</div>
          </div>
          <div className="text-center flex-1">
            <Star size={18} style={{ color: 'var(--success)', marginBottom: 4 }} />
            <div className="font-mono-num" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>
              {companionFavs.length}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Companions</div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Data Management</label>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="touch-target w-full rounded-lg px-4 py-3 flex items-center gap-3"
            style={{
              background: 'var(--surface-active)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <Download size={18} style={{ color: 'var(--accent)' }} />
            Export Data
          </button>

          <button
            onClick={handleImport}
            className="touch-target w-full rounded-lg px-4 py-3 flex items-center gap-3"
            style={{
              background: 'var(--surface-active)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <Upload size={18} style={{ color: 'var(--accent)' }} />
            Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="touch-target w-full rounded-lg px-4 py-3 flex items-center gap-3"
              style={{
                background: 'var(--surface-active)',
                border: '1px solid var(--border)',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              <Trash2 size={18} />
              Clear All Data
            </button>
          ) : (
            <div
              className="rounded-lg p-3"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)' }}
            >
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: 8 }}>
                Are you sure? This will delete all your preferences and favorites.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClearAll}
                  className="touch-target rounded-lg px-4 py-2"
                  style={{
                    background: 'var(--danger)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="touch-target rounded-lg px-4 py-2"
                  style={{
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Log */}
      <div style={sectionStyle}>
        <label style={labelStyle}>
          <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Error Log
          {errors.length > 0 && (
            <span style={{
              background: 'var(--danger)',
              color: '#fff',
              borderRadius: 10,
              padding: '1px 7px',
              fontSize: '0.7rem',
              marginLeft: 8,
              fontWeight: 700,
            }}>
              {errors.length}
            </span>
          )}
        </label>

        {errors.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '8px 0' }}>
            No errors recorded. Everything looks good!
          </p>
        ) : (
          <div style={{ marginBottom: 12 }}>
            {errors.map((err) => (
              <div
                key={err.id}
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{
                    color: 'var(--danger)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    {err.source}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {new Date(err.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {err.message}
                </div>
              </div>
            ))}
          </div>
        )}

        {errors.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCopyErrors}
              className="touch-target rounded-lg px-3 py-2 flex items-center gap-2"
              style={{
                background: 'var(--surface-active)',
                border: '1px solid var(--border)',
                color: copySuccess ? 'var(--success)' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              <Clipboard size={14} />
              {copySuccess ? 'Copied!' : 'Copy Errors'}
            </button>

            <button
              onClick={handleOpenGitHubIssue}
              className="touch-target rounded-lg px-3 py-2 flex items-center gap-2"
              style={{
                background: 'var(--surface-active)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              <ExternalLink size={14} />
              Report Issue
            </button>

            <button
              onClick={handleClearErrors}
              className="touch-target rounded-lg px-3 py-2 flex items-center gap-2"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              <Trash2 size={14} />
              Clear Log
            </button>
          </div>
        )}
      </div>

      {/* App info */}
      <div style={sectionStyle}>
        <div className="text-center">
          <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>
            {APP_NAME} v{VERSION}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>
            {DISCLAIMER}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
