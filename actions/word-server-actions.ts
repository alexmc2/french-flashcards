'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const DEFAULT_SETTINGS = {
  targetWords: 5000,
  useFrequencyOrder: true,
  dailyGoal: 50,
  requiredCorrectAnswers: 3,
};

export async function getNextWord(userId?: string) {
  try {
    // For anonymous users or if settings don't exist, use default settings
    const settings = userId
      ? await prisma.userSettings.findUnique({
          where: { userId },
        })
      : null;

    const userSettings = settings || DEFAULT_SETTINGS;

    // For anonymous users, just get a random word
    if (!userId) {
      return prisma.word.findFirst({
        include: {
          examples: true,
        },
        orderBy: userSettings.useFrequencyOrder
          ? { frequencyRank: 'asc' }
          : { frequencyRank: 'desc' },
      });
    }

    // For logged-in users, get a word they haven't seen or need to review
    let word = await prisma.word.findFirst({
      where: {
        NOT: {
          progress: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        examples: true,
      },
      orderBy: userSettings.useFrequencyOrder
        ? { frequencyRank: 'asc' }
        : { frequencyRank: 'desc' },
    });

    // If no new words, get a word that needs review
    if (!word) {
      word = await prisma.word.findFirst({
        where: {
          progress: {
            some: {
              userId,
              masteryLevel: { lt: userSettings.requiredCorrectAnswers },
            },
          },
        },
        include: {
          examples: true,
        },
        orderBy: userSettings.useFrequencyOrder
          ? { frequencyRank: 'asc' }
          : { frequencyRank: 'desc' },
      });
    }

    // If we found a new word, create initial progress
    if (
      word &&
      !(await prisma.progress.findFirst({ where: { userId, wordId: word.id } }))
    ) {
      await prisma.progress.create({
        data: {
          userId,
          wordId: word.id,
          nextReview: new Date(),
          masteryLevel: 0,
          timesCorrect: 0,
          timesWrong: 0,
        },
      });
    }

    return word;
  } catch (error) {
    console.error('Error getting next word:', error);
    return null;
  }
}

export async function getRandomOptions(
  correctWord: string,
  count: number = 3
): Promise<string[]> {
  const word = await prisma.word.findUnique({
    where: { frenchWord: correctWord },
  });

  if (!word) {
    throw new Error('Word not found');
  }

  // Get distractors from the word's stored distractors
  const distractors = word.distractors as string[][];
  if (distractors && distractors.length > 0) {
    // Join each distractor pair with " / " and return all of them
    return distractors.map((pair) => pair.join(' / '));
  }

  // Fallback to random words if no distractors available
  const fallbackWords = await prisma.word.findMany({
    where: {
      NOT: {
        frenchWord: correctWord,
      },
    },
    select: {
      englishTranslations: true,
    },
    take: count,
    orderBy: {
      // Random selection
      frequencyRank: Math.random() > 0.5 ? 'asc' : 'desc',
    },
  });

  return fallbackWords.map((word) => word.englishTranslations.join(' / '));
}

export async function submitAnswer(
  userId: string,
  wordId: string,
  isCorrect: boolean
) {
  // Skip progress tracking for anonymous users
  if (!userId) return;

  try {
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!userSettings) {
      throw new Error('User settings not found');
    }

    await prisma.progress.upsert({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
      create: {
        userId,
        wordId,
        timesCorrect: isCorrect ? 1 : 0,
        timesWrong: isCorrect ? 0 : 1,
        lastSeen: new Date(),
        nextReview: calculateNextReview(
          0,
          isCorrect,
          userSettings.requiredCorrectAnswers
        ),
        masteryLevel: isCorrect ? 1 : 0,
      },
      update: {
        timesCorrect: { increment: isCorrect ? 1 : 0 },
        timesWrong: { increment: isCorrect ? 0 : 1 },
        lastSeen: new Date(),
        nextReview: {
          set: calculateNextReview(
            0,
            isCorrect,
            userSettings.requiredCorrectAnswers
          ),
        },
        masteryLevel: {
          increment: isCorrect ? 1 : -1,
        },
      },
    });

    revalidatePath('/flashcards');
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

function calculateNextReview(
  masteryLevel: number,
  wasCorrect: boolean,
  requiredCorrectAnswers: number
): Date {
  const now = new Date();
  let hours: number;

  if (wasCorrect) {
    // Exponential spacing based on mastery level
    const progress = masteryLevel / requiredCorrectAnswers;
    if (progress < 0.3) {
      hours = 4;
    } else if (progress < 0.6) {
      hours = 8;
    } else if (progress < 0.9) {
      hours = 24;
    } else {
      hours = 72;
    }
  } else {
    // Review wrong answers soon
    hours = 1;
  }

  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

export async function updateUserSettings(
  userId: string,
  settings: {
    targetWords?: number;
    useFrequencyOrder?: boolean;
    dailyGoal?: number;
    requiredCorrectAnswers?: number;
  }
) {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Settings must be an object');
  }

  const validSettings = {
    ...(settings.targetWords !== undefined && {
      targetWords: settings.targetWords,
    }),
    ...(settings.useFrequencyOrder !== undefined && {
      useFrequencyOrder: settings.useFrequencyOrder,
    }),
    ...(settings.dailyGoal !== undefined && { dailyGoal: settings.dailyGoal }),
    ...(settings.requiredCorrectAnswers !== undefined && {
      requiredCorrectAnswers: settings.requiredCorrectAnswers,
    }),
  };

  await prisma.userSettings.upsert({
    where: { userId },
    update: validSettings,
    create: {
      userId,
      ...validSettings,
    },
  });

  revalidatePath('/flashcards');
}
