'use server';

/**
 * @fileOverview Study plan generation flow.
 *
 * - generateStudyPlan - A function that generates a study plan based on the provided PDF content.
 * - StudyPlanInput - The input type for the generateStudyPlan function.
 * - StudyPlanOutput - The return type for the generateStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudyPlanInputSchema = z.object({
  pdfContent: z
    .string()
    .describe('The content extracted from the PDF document.'),
  topicsOfInterest: z
    .string()
    .optional()
    .describe('Optional list of topics to focus on in the study plan.'),
  timeline: z
    .string()
    .optional()
    .describe('Optional timeline or duration for the study plan.'),
});
export type StudyPlanInput = z.infer<typeof StudyPlanInputSchema>;

const StudyPlanSectionSchema = z.object({
  title: z.string().describe('The title of the study plan section.'),
  content: z.string().describe('The detailed content for this section, formatted as Markdown.'),
});

const StudyPlanOutputSchema = z.object({
  studyPlan: z.array(StudyPlanSectionSchema).describe('The generated study plan, broken down into sections.'),
});
export type StudyPlanOutput = z.infer<typeof StudyPlanOutputSchema>;

export async function generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanOutput> {
  return studyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studyPlanPrompt',
  input: {schema: StudyPlanInputSchema},
  output: {schema: StudyPlanOutputSchema},
  prompt: `Sen bir yapay zeka destekli çalışma planı oluşturucususun. Bir PDF'nin içeriğine dayanarak bir çalışma planı oluştur.

PDF İçeriği: {{{pdfContent}}}

{{~#if topicsOfInterest}}Odaklanılacak Konular: {{{topicsOfInterest}}}{{/if}}
{{~#if timeline}}Zaman Çizelgesi: {{{timeline}}}{{/if}}

Öğrencinin PDF'teki materyali öğrenmesine yardımcı olmak için ayrıntılı ve eyleme geçirilebilir bir çalışma planı oluştur. Çalışma planını, çalışılacak belirli konular ve bunları çalışmak için bir program içeren bölümlere ayır. Her bölümün bir başlığı ve Markdown olarak biçimlendirilmiş ayrıntılı içeriği olmalıdır. Tüm çıktının Türkçe olduğundan emin ol.`,
});

const studyPlanFlow = ai.defineFlow(
  {
    name: 'studyPlanFlow',
    inputSchema: StudyPlanInputSchema,
    outputSchema: StudyPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
