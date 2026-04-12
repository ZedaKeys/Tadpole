import { dualSave, dualLoad, safeRemove } from './storage';
import type { SavedBuild } from '@/types';

const INDEX_KEY = 'tadpole-builds-index';

function buildKey(id: string): string {
  return `tadpole-build-${id}`;
}

export async function saveBuild(build: SavedBuild): Promise<void> {
  await dualSave(buildKey(build.id), build);

  const index = (await dualLoad<string[]>(INDEX_KEY)) ?? [];
  if (!index.includes(build.id)) {
    index.push(build.id);
    await dualSave(INDEX_KEY, index);
  }
}

export async function loadBuild(id: string): Promise<SavedBuild | null> {
  return dualLoad<SavedBuild>(buildKey(id));
}

export async function loadAllBuilds(): Promise<SavedBuild[]> {
  const index = (await dualLoad<string[]>(INDEX_KEY)) ?? [];
  const builds: SavedBuild[] = [];

  for (const id of index) {
    const build = await dualLoad<SavedBuild>(buildKey(id));
    if (build) {
      builds.push(build);
    }
  }

  return builds;
}

export async function deleteBuild(id: string): Promise<void> {
  safeRemove(buildKey(id));

  const index = (await dualLoad<string[]>(INDEX_KEY)) ?? [];
  const updated = index.filter((bid) => bid !== id);
  await dualSave(INDEX_KEY, updated);
}
