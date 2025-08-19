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
  temperatureRange: z.array(z.number()).length(2).describe('The predicted temperature range for the day, [min, max].'),
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
You are simulating a prediction for the machine learning model '{{modelName}}'.

Your task is to predict the energy consumption for the date: {{date}}.
The forecasted temperature range for this day is between {{temperatureRange.[0]}}°C and {{temperatureRange.[1]}}°C.

Based on typical energy usage patterns, provide a realistic but fictional prediction in kWh and a brief analysis. For example, mention factors like day of the week, typical seasonal load, and how temperature (e.g., use of HVAC systems) might influence consumption. Keep the analysis concise (2-3 sentences).
Generate a random but plausible kWh value between 100 and 300, adjusting it based on the temperature. Higher or lower temperatures outside a comfortable range (e.g., 18-22°C) should result in higher consumption.
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
