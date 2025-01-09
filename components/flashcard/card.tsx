// components/flashcard/card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Word } from '@/types/flashcards';

interface FlashcardProps {
  word: Word;
  options: string[];
  onAnswer: (isCorrect: boolean) => void;
  showExamples?: boolean;
  onNext: () => void;
  disabled?: boolean;
}

export function Flashcard({
  word,
  options,
  onAnswer,
  showExamples = true,
  onNext,
  disabled = false,
}: FlashcardProps) {
  const [revealed, setRevealed] = useState(false);
  const correctAnswer = word.englishTranslations.join(' / ');

  const handleOptionClick = (selectedOption: string) => {
    if (disabled || revealed) return;
    const isCorrect = word.englishTranslations.some((translation) =>
      selectedOption.toLowerCase().includes(translation.toLowerCase())
    );
    setRevealed(true);
    onAnswer(isCorrect);
  };

  const handleNext = () => {
    if (disabled) return;
    setRevealed(false);
    onNext();
  };

  return (
    <div
      className='w-full max-w-2xl mx-auto space-y-4'
      role='region'
      aria-label='flashcard'
    >
      <Card>
        <CardContent className='pt-6 text-center'>
          <h2 className='text-3xl font-bold mb-4' lang='fr'>
            {word.frenchWord}
          </h2>

          {showExamples && word.examples && word.examples.length > 0 && (
            <div className='mt-4 text-sm text-muted-foreground'>
              <p className='italic' lang='fr'>
                {word.examples[0].frenchSentence}
              </p>
              {revealed && (
                <p className='mt-1'>{word.examples[0].englishTranslation}</p>
              )}
            </div>
          )}

          <div className='mt-2 text-sm text-muted-foreground'>
            <span className='font-medium'>Part of Speech:</span>{' '}
            {word.partOfSpeech}
          </div>
        </CardContent>
      </Card>

      <div
        className='grid grid-cols-2 gap-4'
        role='group'
        aria-label='answer options'
      >
        {options.map((option, index) => (
          <Button
            key={option}
            onClick={() => handleOptionClick(option)}
            disabled={disabled || revealed}
            variant={
              revealed
                ? option === correctAnswer
                  ? 'default'
                  : 'secondary'
                : 'outline'
            }
            className={cn(
              'h-24 text-lg transition-colors',
              revealed &&
                option === correctAnswer &&
                'bg-green-500 hover:bg-green-600 text-white',
              revealed &&
                option !== correctAnswer &&
                'bg-red-200 hover:bg-red-300 text-muted-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-pressed={revealed}
            role='button'
            aria-label={`Option ${index + 1}: ${option}`}
          >
            {option}
          </Button>
        ))}
      </div>

      {revealed && (
        <div className='text-center'>
          <Button
            onClick={handleNext}
            disabled={disabled}
            className='mt-4'
            aria-label='Next word'
          >
            Next Word
          </Button>
        </div>
      )}
    </div>
  );
}
