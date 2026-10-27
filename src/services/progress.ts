import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@english-listening/progress-v1';

export type LearningProgress = {
  completedSongIds: string[];
  bestAccuracyBySong: Record<string, number>;
  totalPractices: number;
  history?: { songId: string; accuracy: number; correctAnswers: number; totalBlanks: number; answers: Record<string, string>; completedAt: string }[];
};

const emptyProgress: LearningProgress = {
  completedSongIds: [],
  bestAccuracyBySong: {},
  totalPractices: 0,
};

function isLearningProgress(value: unknown): value is LearningProgress {
  if (!value || typeof value !== 'object') return false;
  const progress = value as Partial<LearningProgress>;
  return Array.isArray(progress.completedSongIds)
    && progress.completedSongIds.every((id) => typeof id === 'string')
    && typeof progress.bestAccuracyBySong === 'object'
    && progress.bestAccuracyBySong !== null
    && typeof progress.totalPractices === 'number';
}

async function readProgress(): Promise<LearningProgress> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyProgress;
  const parsed: unknown = JSON.parse(raw);
  if (!isLearningProgress(parsed)) throw new Error('Invalid practice history');
  return parsed;
}

export async function getProgress(): Promise<LearningProgress> {
  try { return await readProgress(); }
  catch { return emptyProgress; }
}

export async function saveResult(songId: string, accuracy: number, detail: { correctAnswers: number; totalBlanks: number; answers: Record<string, string> }): Promise<LearningProgress> {
  // Never overwrite existing history with an empty result after a read failure.
  // Propagate the failure to PracticeScreen so the user can retry submission.
  const progress = await readProgress();
  const next: LearningProgress = {
    completedSongIds: progress.completedSongIds.includes(songId)
      ? progress.completedSongIds
      : [...progress.completedSongIds, songId],
    bestAccuracyBySong: {
      ...progress.bestAccuracyBySong,
      [songId]: Math.max(progress.bestAccuracyBySong[songId] ?? 0, accuracy),
    },
    totalPractices: progress.totalPractices + 1,
    history: [...(progress.history ?? []), { songId, accuracy, ...detail, completedAt: new Date().toISOString() }],
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

const draftKey = (songId: string) => `@english-listening/draft/${songId}`;
let draftWrites = Promise.resolve();

export async function removeSongProgress(songId: string): Promise<void> {
  await draftWrites;
  const progress = await readProgress();
  const keys = await AsyncStorage.getAllKeys();
  const drafts = keys.filter(key => key === draftKey(songId) || key.startsWith(`${draftKey(songId)}:rules-`));
  const removedCount = (progress.history ?? []).filter(item => item.songId === songId).length;
  const bestAccuracyBySong = { ...progress.bestAccuracyBySong };
  delete bestAccuracyBySong[songId];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...progress,
    completedSongIds: progress.completedSongIds.filter(id => id !== songId),
    bestAccuracyBySong,
    totalPractices: Math.max(0, progress.totalPractices - removedCount),
    history: (progress.history ?? []).filter(item => item.songId !== songId),
  }));
  if (drafts.length) await AsyncStorage.multiRemove(drafts);
}

export async function getDraft(songId: string): Promise<Record<string, string>> {
  await draftWrites;
  const raw = await AsyncStorage.getItem(draftKey(songId));
  const value: unknown = raw ? JSON.parse(raw) : {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, answer]) => typeof answer === 'string'));
}

export function saveDraft(songId: string, answers: Record<string, string>): Promise<void> {
  const write = draftWrites.then(() => AsyncStorage.setItem(draftKey(songId), JSON.stringify(answers)));
  draftWrites = write.catch(() => {});
  return write;
}
