import { Settings } from '@/components/flashcard/settings';
import { AuthNav } from '@/components/auth/auth-nav';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { updateUserSettings } from '@/actions/word-server-actions';
import Link from 'next/link';
import type { FlashcardSettings } from '@/types/flashcards';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get or create user settings
  let settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId: user.id,
        targetWords: 5000,
        useFrequencyOrder: true,
        dailyGoal: 50,
        requiredCorrectAnswers: 3,
      },
    });
  }

  const handleSave = async (newSettings: FlashcardSettings) => {
    'use server';
    if (!newSettings || typeof newSettings !== 'object') return;
    await updateUserSettings(user.id, {
      targetWords: newSettings.targetWords,
      useFrequencyOrder: newSettings.useFrequencyOrder,
      dailyGoal: newSettings.dailyGoal,
      requiredCorrectAnswers: newSettings.requiredCorrectAnswers,
    });
  };

  return (
    <div className='min-h-screen'>
      <AuthNav />
      <div className='container mx-auto px-4 py-8'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold'>Settings</h1>
          <Link
            href='/flashcards'
            className='px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90'
          >
            Back to Flashcards
          </Link>
        </div>
        <div className='max-w-md mx-auto'>
          <Settings settings={settings} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
