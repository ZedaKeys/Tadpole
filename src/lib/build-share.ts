import type { SavedBuild } from '@/types';

const MAX_URL_LENGTH = 2000;

/**
 * Strip non-essential fields to keep the URL short.
 * Removes timestamps; keeps all build-defining data.
 */
function stripForShare(build: SavedBuild): Record<string, unknown> {
  return {
    n: build.name,
    r: build.race,
    sr: build.subrace || undefined,
    bg: build.background,
    bs: build.baseScores,
    lv: build.levels,
    fc: build.featChoices,
    sk: build.chosenSkills,
    sp: build.chosenSpells,
  };
}

/**
 * Encode a build into a URL-safe string using btoa + encodeURIComponent.
 */
export function encodeBuild(build: SavedBuild): string {
  const slim = stripForShare(build);
  const json = JSON.stringify(slim);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded;
}

/**
 * Decode a URL-safe string back into a build object.
 * Returns null if decoding fails.
 */
export function decodeBuild(encoded: string): SavedBuild | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const obj = JSON.parse(json) as Record<string, unknown>;

    return {
      id: crypto.randomUUID(),
      name: (obj.n as string) || 'Shared Build',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      race: (obj.r as string) || '',
      subrace: obj.sr as string | undefined,
      background: (obj.bg as string) || '',
      baseScores: obj.bs as SavedBuild['baseScores'],
      levels: obj.lv as SavedBuild['levels'],
      featChoices: (obj.fc as SavedBuild['featChoices']) || [],
      chosenSkills: (obj.sk as SavedBuild['chosenSkills']) || [],
      chosenSpells: (obj.sp as SavedBuild['chosenSpells']) || [],
    };
  } catch {
    return null;
  }
}

/**
 * Generate the full share URL for a build.
 * Returns the relative path (e.g. /builds/shared?b=ENCODED).
 */
export function getSharePath(build: SavedBuild): string {
  const encoded = encodeBuild(build);
  const path = `/builds/shared?b=${encodeURIComponent(encoded)}`;
  return path;
}

/**
 * Check if the share URL would be within safe limits.
 */
export function isShareUrlTooLong(build: SavedBuild): boolean {
  const path = getSharePath(build);
  return path.length > MAX_URL_LENGTH;
}
