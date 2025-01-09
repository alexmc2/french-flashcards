// types/flashcards.ts

export interface Example {
  id: string;
  frenchSentence: string;
  englishTranslation: string;
}

export interface Word {
  id: string;
  frenchWord: string;
  englishTranslations: string[];
  distractors?: string[][];
  partOfSpeech: string;
  frequencyRank: number;
  examples: Example[];
  progress?: Progress[];
}

export interface Progress {
  id: string;
  userId: string;
  wordId: string;
  timesCorrect: number;
  timesWrong: number;
  lastSeen?: Date;
  nextReview?: Date;
  masteryLevel: number;
}

export interface FlashcardSettings {
  targetWords: number;
  useFrequencyOrder: boolean;
  dailyGoal: number;
  showExamples: boolean;
  requiredCorrectAnswers: number;
}

export interface Session {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  wordsStudied: number;
  correctCount: number;
  wrongCount: number;
}
