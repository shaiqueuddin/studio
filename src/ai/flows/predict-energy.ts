'use server';
/**
 * @fileOverview An energy consumption prediction AI agent.
 *
 * - predictEnergyConsumption - A function that handles the energy prediction process.
 * - PredictEnergyInput - The input type for the predictEnergyConsumption function.
 * - PredictEnergyOutput - The return type for the predictEnergyConsumption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictEnergyInputSchema = z.object({
  date: z.string().describe('The date for which to predict energy consumption, in ISO format.'),
  modelName: z.string().describe('The name of the machine learning model.'),
  datasetName: z.string().describe('The name of the dataset used for training.'),
});
export type PredictEnergyInput = z.infer<typeof PredictEnergyInputSchema>;

const PredictEnergyOutputSchema = z.object({
  predictedConsumption: z.number().describe('The predicted energy consumption in kWh.'),
  analysis: z.string().describe('A brief analysis of the prediction, considering the date and model.'),
});
export type PredictEnergyOutput = z.infer<typeof PredictEnergyOutputSchema>;

export async function predictEnergyConsumption(input: PredictEnergyInput): Promise<PredictEnergyOutput> {
  return predictEnergyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictEnergyPrompt',
  input: {schema: PredictEnergyInputSchema},
  output: {schema: PredictEnergyOutputSchema},
  prompt: `You are an AI data scientist specializing in energy consumption forecasting.
You have been given a machine learning model '{{modelName}}' trained on the '{{datasetName}}' dataset.

Your task is to predict the energy consumption for the date: {{date}}.

Based on typical energy usage patterns, provide a realistic but fictional prediction in kWh and a brief analysis. For example, mention factors like day of the week, typical seasonal load, and how the model might interpret these to arrive at its prediction. Keep the analysis concise (2-3 sentences).
Generate a random but plausible kWh value between 100 and 300.
`,
});

const predictEnergyFlow = ai.defineFlow(
  {
    name: 'predictEnergyFlow',
    inputSchema: PredictEnergyInputSchema,
    outputSchema: PredictEnergyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
