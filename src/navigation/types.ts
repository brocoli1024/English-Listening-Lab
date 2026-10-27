import type { Song } from '@/model/Song';

export type PracticeResult = {
  song: Song;
  correctAnswers: number;
  totalBlanks: number;
  accuracy: number;
};

export type RootStackParamList = {
  Home: undefined;
  Support: undefined;
  Setup: { song?: Song };
  Practice: { song: Song };
  Results: { result: PracticeResult };
};
