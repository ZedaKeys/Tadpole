'use client';

import { X, GripVertical, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';

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
  const visibleCount = widgets.filter((id) => !hidden.includes(id)).length;

  return (
    <div className="widget-customizer-backdrop" onClick={onClose}>
      <div className="widget-customizer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <div>
            <span className="micro-label">Layout Console</span>
            <h2>Customize Widgets</h2>
            <p>{visibleCount} visible · {hidden.length} hidden</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button-premium"
            aria-label="Close widget customizer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="widget-customizer-note">Toggle visibility &amp; reorder dashboard widgets.</p>

        <div className="widget-list">
          {widgets.map((id, idx) => {
            const isHidden = hidden.includes(id);
            return (
              <div key={id} className={`widget-list-row ${isHidden ? 'is-muted' : ''}`}>
                <div className="reorder-controls" aria-label={`Reorder ${getWidgetName(id)}`}>
                  <button
                    type="button"
                    onClick={() => idx > 0 && onReorder(idx, idx - 1)}
                    disabled={idx === 0}
                    aria-label="Move widget up"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => idx < widgets.length - 1 && onReorder(idx, idx + 1)}
                    disabled={idx === widgets.length - 1}
                    aria-label="Move widget down"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>

                <GripVertical size={16} className="widget-subtle-text" aria-hidden="true" />
                <span className="widget-list-label">{getWidgetName(id)}</span>

                <button
                  type="button"
                  onClick={() => onToggle(id)}
                  className={`visibility-toggle ${isHidden ? '' : 'is-visible'}`}
                  aria-label={`${isHidden ? 'Show' : 'Hide'} ${getWidgetName(id)}`}
                >
                  {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
