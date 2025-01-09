import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface WordData {
  id: string;
  frenchWord: string;
  englishTranslations: string[];
  partOfSpeech: string[];
  frequencyRank: number;
  distractors: string[][];
  examples?: {
    frenchSentence: string;
    englishTranslation: string;
  }[];
}

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...');

  // Delete in order of dependencies
  await prisma.progress.deleteMany();
  await prisma.example.deleteMany();
  await prisma.word.deleteMany();

  console.log('✅ Database cleaned');
}

async function seedWords() {
  try {
    // Clean existing data first
    await cleanDatabase();

    const wordsData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'words.json'), 'utf8')
    ) as WordData[];

    // Track unique words and duplicates
    const seenWords = new Set<string>();
    const duplicates = new Set<string>();

    console.log(`Starting to seed ${wordsData.length} words...`);

    // Process in batches of 50 to avoid timeouts
    const batchSize = 50;
    const totalBatches = Math.ceil(wordsData.length / batchSize);

    for (let i = 0; i < wordsData.length; i += batchSize) {
      const batch = wordsData.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;

      console.log(
        `Processing batch ${currentBatch} of ${totalBatches} (${Math.round((currentBatch / totalBatches) * 100)}%)`
      );

      await Promise.all(
        batch.map(async (word) => {
          // Check for duplicates
          if (seenWords.has(word.frenchWord)) {
            duplicates.add(word.frenchWord);
            return; // Skip this word
          }
          seenWords.add(word.frenchWord);

          const partOfSpeech =
            Array.isArray(word.partOfSpeech) && word.partOfSpeech.length > 0
              ? word.partOfSpeech[0]
              : 'unknown';

          try {
            return await prisma.word.create({
              data: {
                frenchWord: word.frenchWord,
                englishTranslations: word.englishTranslations,
                distractors: word.distractors,
                partOfSpeech,
                frequencyRank: word.frequencyRank,
                examples: {
                  create:
                    word.examples?.map((example) => ({
                      frenchSentence: example.frenchSentence,
                      englishTranslation: example.englishTranslation,
                    })) || [],
                },
              },
            });
          } catch (error) {
            console.error(`Error processing word "${word.frenchWord}":`, error);
          }
        })
      );
    }

    // Log duplicate words if any were found
    if (duplicates.size > 0) {
      console.log('\n⚠️ Found duplicate words:');
      console.log(Array.from(duplicates).join(', '));
    }

    console.log(`\n✅ Successfully seeded ${seenWords.size} unique words`);
    if (duplicates.size > 0) {
      console.log(`⚠️ Skipped ${duplicates.size} duplicate words`);
    }
  } catch (error) {
    console.error('Error seeding words:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the seeding
seedWords();
