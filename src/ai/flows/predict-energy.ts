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
  city: z.string().describe('The city for which to predict energy consumption.'),
});
export type PredictEnergyInput = z.infer<typeof PredictEnergyInputSchema>;

const PredictEnergyOutputSchema = z.object({
  predictedConsumption: z.number().describe('The predicted energy consumption in kWh.'),
  analysis: z.string().describe('A brief analysis of the prediction, considering the date and model.'),
  temperatureRange: z.array(z.number()).length(2).describe('The predicted temperature range for the day, [min, max].'),
});
export type PredictEnergyOutput = z.infer<typeof PredictEnergyOutputSchema>;

export async function predictEnergyConsumption(input: PredictEnergyInput): Promise<PredictEnergyOutput> {
  return predictEnergyFlow(input);
}

const getTemperatureForCity = ai.defineTool(
    {
      name: 'getTemperatureForCity',
      description: 'Gets the forecasted temperature range for a given city and date.',
      inputSchema: z.object({
        city: z.string(),
        date: z.string(),
      }),
      outputSchema: z.object({
        temperatureRange: z.array(z.number()).length(2),
      }),
    },
    async (input) => {
      // In a real application, this would call a weather API.
      // Here, we'll generate a plausible, random temperature based on the city name length and date.
      const pseudoRandom = (input.city.length + new Date(input.date).getDate()) % 30;
      let minTemp, maxTemp;

      if (pseudoRandom < 10) { // Cold
        minTemp = -5 + pseudoRandom;
        maxTemp = minTemp + 10;
      } else if (pseudoRandom < 20) { // Temperate
        minTemp = 10 + (pseudoRandom - 10);
        maxTemp = minTemp + 10;
      } else { // Hot
        minTemp = 25 + (pseudoRandom - 20);
        maxTemp = minTemp + 12;
      }
      
      return { temperatureRange: [minTemp, maxTemp] };
    }
  );

const prompt = ai.definePrompt({
  name: 'predictEnergyPrompt',
  tools: [getTemperatureForCity],
  input: {schema: PredictEnergyInputSchema},
  output: {schema: PredictEnergyOutputSchema},
  prompt: `You are an AI data scientist specializing in energy consumption forecasting.
You are simulating a prediction for the machine learning model '{{modelName}}'.

Your task is to predict the energy consumption for the city of {{city}} on the date: {{date}}.

First, use the getTemperatureForCity tool to get the forecasted temperature range for this day.

Based on the temperature and typical energy usage patterns, provide a realistic but fictional prediction in kWh and a brief analysis. Mention factors like the day of the week, typical seasonal load, and how the fetched temperature will influence consumption. Keep the analysis concise (2-3 sentences).
Generate a random but plausible kWh value between 100 and 300.

The energy consumption is most efficient when the temperature is between 24-29°C.
- If the temperature is lower than this range, consumption should increase due to heating loads.
- If the temperature is higher than this range, consumption should increase due to cooling loads.
- Adjust the predicted kWh value based on how far the temperature is from this efficient range.
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
