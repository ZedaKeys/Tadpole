'use client';

import { useState, useEffect, useCallback } from 'react';

const WIDGET_KEY = 'tadpole_widgets';

const DEFAULT_ORDER = [
  'character',
  'partyHealth',
  'xpProgress',
  'goldResources',
  'combatStatus',
  'encumbrance',
  'spellSlots',
  'conditions',
  'deathSaves',
  'campSupplies',
  'stealthVision',
  'characterFlags',
  'sessionTimeline',
];

const DEFAULT_HIDDEN: string[] = [];

interface WidgetConfig {
  order: string[];
  hidden: string[];
}

function loadConfig(): WidgetConfig {
  try {
    const raw = localStorage.getItem(WIDGET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        order: Array.isArray(parsed.order) ? parsed.order : DEFAULT_ORDER,
        hidden: Array.isArray(parsed.hidden) ? parsed.hidden : DEFAULT_HIDDEN,
      };
    }
  } catch {}
  return { order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN };
}

function saveConfig(config: WidgetConfig) {
  try {
    localStorage.setItem(WIDGET_KEY, JSON.stringify(config));
  } catch {}
}

export function useWidgetConfig() {
  const [config, setConfig] = useState<WidgetConfig>(loadConfig);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const widgets = config.order.filter((id) => !config.hidden.includes(id));

  const toggle = useCallback((id: string) => {
    setConfig((prev) => {
      const isHidden = prev.hidden.includes(id);
      return {
        ...prev,
        hidden: isHidden
          ? prev.hidden.filter((h) => h !== id)
          : [...prev.hidden, id],
      };
    });
  }, []);

  const reorder = useCallback((fromIdx: number, toIdx: number) => {
    setConfig((prev) => {
      const newOrder = [...prev.order];
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, moved);
      return { ...prev, order: newOrder };
    });
  }, []);

  const showAll = useCallback(() => {
    setConfig((prev) => ({ ...prev, hidden: [] }));
  }, []);

  const resetToDefault = useCallback(() => {
    setConfig({ order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN });
  }, []);

  return {
    widgets,
    hidden: config.hidden,
    allWidgets: config.order,
    toggle,
    reorder,
    showAll,
    resetToDefault,
  };
}
