export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export type LyricLine = {
  timestamp: number;
  english: string;
  chinese: string;
  blankedWords: string[];
  blankTokenIndices?: number[];
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  difficulty: Difficulty;
  accentColor: string;
  audioSource: number | { uri: string };
  synced?: boolean;
  imported?: boolean;
  audioUnavailable?: boolean;
  exerciseVersion?: number;
  lyrics: LyricLine[];
};

const songs: Song[] = [
  {
    id: 'twinkle-twinkle-little-star', title: 'Twinkle, Twinkle, Little Star', artist: 'Traditional · vocal by Dcoetzee', difficulty: Difficulty.Easy, accentColor: '#2563EB',
    audioSource: require('../../assets/audio/twinkle-twinkle-vocal.wav'),
    lyrics: [
      { timestamp: 0, english: 'Twinkle, twinkle, little star,', chinese: '一閃一閃小星星，', blankedWords: ['Twinkle', 'star'] },
      { timestamp: 4, english: 'How I wonder what you are!', chinese: '我多想知道你是什麼！', blankedWords: ['wonder'] },
      { timestamp: 8, english: 'Up above the world so high,', chinese: '高高地掛在世界之上，', blankedWords: ['above', 'high'] },
      { timestamp: 12, english: 'Like a diamond in the sky.', chinese: '像天空中的一顆鑽石。', blankedWords: ['diamond', 'sky'] },
    ],
  },
  {
    id: 'mary-had-a-little-lamb', title: 'Mary Had a Little Lamb', artist: 'Traditional · vocal by Celestianpower', difficulty: Difficulty.Easy, accentColor: '#16A34A',
    audioSource: require('../../assets/audio/mary-little-lamb-vocal.wav'),
    lyrics: [
      { timestamp: 0, english: 'Mary had a little lamb,', chinese: '瑪麗有一隻小羊，', blankedWords: ['Mary', 'lamb'] },
      { timestamp: 4, english: 'Its fleece was white as snow.', chinese: '牠的羊毛白得像雪。', blankedWords: ['fleece', 'snow'] },
      { timestamp: 8, english: 'And everywhere that Mary went,', chinese: '瑪麗去到的每一個地方，', blankedWords: ['everywhere', 'went'] },
    ],
  },
  {
    id: 'london-bridge-is-falling-down', title: 'London Bridge Is Falling Down', artist: 'Traditional · vocal by Stephen Griffith', difficulty: Difficulty.Medium, accentColor: '#EA580C',
    audioSource: require('../../assets/audio/london-bridge-vocal.wav'),
    lyrics: [
      { timestamp: 0, english: 'London Bridge is falling down,', chinese: '倫敦橋正在倒下，', blankedWords: ['London', 'falling'] },
      { timestamp: 4, english: 'Falling down, falling down,', chinese: '正在倒下，正在倒下，', blankedWords: ['down'] },
      { timestamp: 8, english: 'My fair lady.', chinese: '我美麗的女士。', blankedWords: ['fair', 'lady'] },
    ],
  },
];

export const dummySongs = songs;
