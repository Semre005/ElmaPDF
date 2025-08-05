'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating multiple-choice test questions from PDF content.
 *
 * It includes:
 * - generateTestQuestions: An async function that takes PDF content as input and returns generated test questions.
 * - TestQuestionGenerationInput: The input type for the generateTestQuestions function, defining the PDF content.
 * - TestQuestionGenerationOutput: The output type, which includes an array of multiple-choice questions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TestQuestionGenerationInputSchema = z.object({
  pdfContent: z
    .string()
    .describe('The content of the PDF document to generate questions from.'),
  difficulty: z.enum(['Kolay', 'Orta', 'Zor']).describe('The difficulty of the test questions.'),
  questionCount: z.number().describe('The number of questions to generate.')
});
export type TestQuestionGenerationInput = z.infer<
  typeof TestQuestionGenerationInputSchema
>;

const TestQuestionGenerationOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe('The test question.'),
        options: z.array(z.string()).describe('The multiple-choice options.'),
        answer: z.string().describe('The correct answer to the question.'),
      })
    )
    .describe('An array of multiple-choice test questions.'),
});
export type TestQuestionGenerationOutput = z.infer<
  typeof TestQuestionGenerationOutputSchema
>;

export async function generateTestQuestions(
  input: TestQuestionGenerationInput
): Promise<TestQuestionGenerationOutput> {
  return testQuestionGenerationFlow(input);
}

const testQuestionGenerationPrompt = ai.definePrompt({
  name: 'testQuestionGenerationPrompt',
  input: {schema: TestQuestionGenerationInputSchema},
  output: {schema: TestQuestionGenerationOutputSchema},
  prompt: `You are an expert educator creating multiple-choice questions in Turkish to test a student's understanding of a document. Focus on the main subjects and key concepts from the content provided. Ignore metadata like author names or course details.

  Generate {{questionCount}} multiple-choice questions based on the following content.
  The difficulty level should be: {{difficulty}}.

  - If difficulty is 'Kolay', ask direct questions about the main topics.
  - If difficulty is 'Orta', ask questions that require remembering specific details or definitions.
  - If difficulty is 'Zor', ask questions that require interpretation, comparison, or synthesis of information from the document.

  Content:
  {{pdfContent}}

  Each question should have 4 answer options, with one correct answer.
  Make sure each question is about a key concept in the document and matches the requested difficulty.
  Return questions, options and the correct answer in JSON format. All text should be in Turkish.
`,
});

const testQuestionGenerationFlow = ai.defineFlow(
  {
    name: 'testQuestionGenerationFlow',
    inputSchema: TestQuestionGenerationInputSchema,
    outputSchema: TestQuestionGenerationOutputSchema,
  },
  async input => {
    const {output} = await testQuestionGenerationPrompt(input);
    return output!;
  }
);
