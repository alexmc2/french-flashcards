'use server';

import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function createUserSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error('Not authenticated');
  }

  try {
    // Create or update the user record first
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email },
      create: {
        id: user.id,
        email: user.email,
      },
    });

    // Then create the user settings
    const userSettings = await prisma.userSettings.create({
      data: {
        userId: dbUser.id,
        targetWords: 5000,
        useFrequencyOrder: true,
        dailyGoal: 50,
        requiredCorrectAnswers: 3,
      },
    });

    return userSettings;
  } catch (error) {
    console.error('Error creating user settings:', error);
    throw new Error('Failed to create user settings');
  }
}
