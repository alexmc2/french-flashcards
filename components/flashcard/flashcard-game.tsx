'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getNextWord,
  getRandomOptions,
  submitAnswer,
} from '@/actions/word-server-actions';
import { Flashcard } from './card';
import type { Word } from '@/types/flashcards';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FlashcardGameProps {
  userId?: string;
}

export function FlashcardGame({ userId }: FlashcardGameProps) {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const loadNextWord = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const word = await getNextWord(userId);
      if (!word) {
        setCurrentWord(null);
        setOptions([]);
        return;
      }

      const allTranslations = word.englishTranslations.join(' / ');
      const distractors = await getRandomOptions(word.frenchWord, 3);
      const allOptions = [allTranslations, ...distractors];

      // Shuffle options
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

      // Convert Prisma Word to our Word type
      setCurrentWord({
        ...word,
        distractors: word.distractors as string[][] | undefined,
      });
      setOptions(shuffledOptions);
    } catch (error) {
      console.error('Error loading next word:', error);
      setError('Failed to load word. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNextWord();
  }, [loadNextWord]);

  const handleAnswer = async (isCorrect: boolean) => {
    if (currentWord) {
      if (!userId) {
        setShowLoginPrompt(true);
        return;
      }
      try {
        await submitAnswer(userId, currentWord.id, isCorrect);
      } catch (error) {
        console.error('Error submitting answer:', error);
      }
    }
  };

  // Render a stable container div that's always present
  return (
    <div
      className='min-h-[400px] w-full flex items-center justify-center'
      role='main'
    >
      {loading ? (
        <div className='text-center py-12'>
          <p className='text-lg'>Loading...</p>
        </div>
      ) : error ? (
        <div className='text-center py-12'>
          <p className='text-lg text-red-500 mb-4'>{error}</p>
          <button
            onClick={loadNextWord}
            className='px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90'
          >
            Try Again
          </button>
        </div>
      ) : !currentWord ? (
        <div className='text-center py-12'>
          <p className='text-lg mb-4'>No more words to review right now!</p>
          <button
            onClick={loadNextWord}
            className='px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90'
          >
            Check Again
          </button>
        </div>
      ) : (
        <>
          <Flashcard
            word={currentWord}
            options={options}
            onAnswer={handleAnswer}
            onNext={loadNextWord}
          />
          {showLoginPrompt && (
            <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4'>
              <div className='bg-background rounded-lg p-6 max-w-md w-full'>
                <h3 className='text-lg font-semibold mb-2'>
                  Save Your Progress
                </h3>
                <p className='text-muted-foreground mb-4'>
                  Sign in to save your progress and track your learning journey.
                  Your progress will be lost when you close the browser.
                </p>
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => setShowLoginPrompt(false)}
                  >
                    Continue Anonymously
                  </Button>
                  <Link href='/auth'>
                    <Button>Sign In</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
