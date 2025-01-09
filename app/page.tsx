import { Suspense } from 'react';
import { FlashcardGame } from '@/components/flashcard/flashcard-game';
import { AuthNav } from '@/components/auth/auth-nav';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className='min-h-screen'>
      <AuthNav />
      <div className='container mx-auto px-4 py-8'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold'>French Flashcards</h1>
          <div className='flex gap-4 items-center'>
            {user && (
              <Link
                href='/settings'
                className='px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90'
              >
                Settings
              </Link>
            )}
          </div>
        </div>
        {!user && (
          <div className='mb-8 p-4 bg-muted rounded-lg flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Sign in to save your progress
            </p>
            <Link href='/auth'>
              <Button variant='outline'>Sign In</Button>
            </Link>
          </div>
        )}
        <Suspense
          fallback={<div className='text-center py-12'>Loading...</div>}
        >
          <FlashcardGame userId={user?.id} />
        </Suspense>
      </div>
    </div>
  );
}
