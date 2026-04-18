'use client';

import { X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useCallback } from 'react';

interface WidgetCustomizerProps {
  widgets: string[];
  hidden: string[];
  onToggle: (id: string) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onClose: () => void;
}

const WIDGET_NAMES: Record<string, string> = {
  character: 'Character',
  partyHealth: 'Party Health',
  xpProgress: 'XP Progress',
  goldResources: 'Gold',
  combatStatus: 'Combat',
  encumbrance: 'Encumbrance',
  spellSlots: 'Spell Slots',
  conditions: 'Conditions',
  deathSaves: 'Death Saves',
  campSupplies: 'Camp Supplies',
  stealthVision: 'Stealth & Vision',
  characterFlags: 'Character Flags',
  sessionTimeline: 'Timeline',
  liveFeed: 'Live Feed',
};

function getWidgetName(id: string): string {
  return WIDGET_NAMES[id] ?? id;
}

export default function WidgetCustomizer({
  widgets,
  hidden,
  onToggle,
  onReorder,
  onClose,
}: WidgetCustomizerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          background: 'rgba(26, 26, 38, 0.98)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          overflow: 'auto',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          background: 'rgba(26, 26, 38, 0.98)',
          zIndex: 2,
        }}>
          <h3 style={{ color: '#e8e8ef', margin: 0, fontSize: 18, fontWeight: 600 }}>
            Customize Widgets
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Drag handle indicator */}
        <div style={{
          padding: '12px 20px 0',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 11,
        }}>
          Toggle visibility &amp; reorder widgets
        </div>

        {/* Widget list */}
        <div style={{ padding: '8px 12px 20px' }}>
          {widgets.map((id, idx) => {
            const isHidden = hidden.includes(id);
            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 12,
                  opacity: isHidden ? 0.45 : 1,
                  minHeight: 52,
                }}
              >
                {/* Reorder controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <button
                    onClick={() => idx > 0 && onReorder(idx, idx - 1)}
                    disabled={idx === 0}
                    style={{
                      width: 28,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      cursor: idx === 0 ? 'default' : 'pointer',
                      color: idx === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.45)',
                      padding: 0,
                    }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => idx < widgets.length - 1 && onReorder(idx, idx + 1)}
                    disabled={idx === widgets.length - 1}
                    style={{
                      width: 28,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      cursor: idx === widgets.length - 1 ? 'default' : 'pointer',
                      color: idx === widgets.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.45)',
                      padding: 0,
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Drag handle */}
                <GripVertical size={16} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />

                {/* Name */}
                <span style={{
                  flex: 1,
                  color: isHidden ? 'rgba(255,255,255,0.35)' : '#e8e8ef',
                  fontSize: 15,
                  fontWeight: 500,
                  textDecoration: isHidden ? 'line-through' : 'none',
                }}>
                  {getWidgetName(id)}
                </span>

                {/* Toggle switch */}
                <button
                  onClick={() => onToggle(id)}
                  style={{
                    width: 44,
                    height: 26,
                    borderRadius: 13,
                    background: isHidden ? 'rgba(255,255,255,0.1)' : '#48bfe3',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: isHidden ? 3 : 21,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
