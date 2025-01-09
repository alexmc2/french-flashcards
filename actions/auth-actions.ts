'use server';

import prisma from '@/lib/prisma';

export async function createUserSettings(userId: string, email: string) {
  try {
    // First create the user
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email,
      },
    });

    // Then create the user settings
    const settings = await prisma.userSettings.create({
      data: {
        userId: user.id,
        targetWords: 5000,
        useFrequencyOrder: true,
        dailyGoal: 50,
        requiredCorrectAnswers: 3,
      },
    });

    return settings;
  } catch (error) {
    console.error('Error creating user and settings:', error);
    throw new Error('Failed to create user and settings');
  }
}
