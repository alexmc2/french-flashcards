// components/flashcard/settings.tsx
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { FlashcardSettings } from '@/types/flashcards';

const settingsSchema = z.object({
  targetWords: z.number().min(1).max(10000),
  useFrequencyOrder: z.boolean(),
  dailyGoal: z.number().min(1).max(5000),
  showExamples: z.boolean(),
  requiredCorrectAnswers: z.number().min(1).max(10),
});

interface SettingsProps {
  settings: FlashcardSettings;
  onSave: (settings: FlashcardSettings) => void;
  disabled?: boolean;
}

export function Settings({
  settings,
  onSave,
  disabled = false,
}: SettingsProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FlashcardSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const onSubmit = (data: FlashcardSettings) => {
    try {
      const validatedData = settingsSchema.parse(data);
      setError(null);
      onSave(validatedData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Flashcard Settings</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='targetWords'>
              Number of Words to Study (1-10000)
            </Label>
            <Input
              id='targetWords'
              type='number'
              {...register('targetWords', { valueAsNumber: true })}
              disabled={disabled}
              aria-invalid={!!errors.targetWords}
              aria-describedby={
                errors.targetWords ? 'targetWords-error' : undefined
              }
            />
            {errors.targetWords && (
              <p id='targetWords-error' className='text-sm text-red-500'>
                {errors.targetWords.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='requiredCorrectAnswers'>
              Required Correct Answers to Master (1-10)
            </Label>
            <Input
              id='requiredCorrectAnswers'
              type='number'
              {...register('requiredCorrectAnswers', { valueAsNumber: true })}
              disabled={disabled}
              aria-invalid={!!errors.requiredCorrectAnswers}
              aria-describedby={
                errors.requiredCorrectAnswers
                  ? 'requiredCorrectAnswers-error'
                  : undefined
              }
            />
            {errors.requiredCorrectAnswers && (
              <p
                id='requiredCorrectAnswers-error'
                className='text-sm text-red-500'
              >
                {errors.requiredCorrectAnswers.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='dailyGoal'>Daily Goal (1-500 words)</Label>
            <Input
              id='dailyGoal'
              type='number'
              {...register('dailyGoal', { valueAsNumber: true })}
              disabled={disabled}
              aria-invalid={!!errors.dailyGoal}
              aria-describedby={
                errors.dailyGoal ? 'dailyGoal-error' : undefined
              }
            />
            {errors.dailyGoal && (
              <p id='dailyGoal-error' className='text-sm text-red-500'>
                {errors.dailyGoal.message}
              </p>
            )}
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='useFrequencyOrder'
              {...register('useFrequencyOrder')}
              disabled={disabled}
            />
            <Label htmlFor='useFrequencyOrder'>
              Study words in frequency order
            </Label>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='showExamples'
              {...register('showExamples')}
              disabled={disabled}
            />
            <Label htmlFor='showExamples'>Show example sentences</Label>
          </div>

          {error && (
            <p className='text-sm text-red-500' role='alert'>
              {error}
            </p>
          )}

          <Button type='submit' className='w-full' disabled={disabled}>
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
