import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generates a 1536-dimensional embedding for the provided text using Gemini.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} - The 1536-dimensional embedding vector.
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Valid text is required to generate an embedding.');
  }

  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2-preview',
    contents: text,
    config: {
      outputDimensionality: 1536,
    },
  });

  if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
    throw new Error('Invalid response from Gemini Embedding API.');
  }

  return response.embeddings[0].values;
};

/**
 * Generates an answer from Gemini based on a provided prompt and system instructions.
 * Used for RAG to ensure grounded answers based only on context.
 * 
 * @param {string} systemInstruction - Instructions to strictly guide the model.
 * @param {string} prompt - The user question and retrieved context.
 * @returns {Promise<string>} - The generated answer.
 */
export const generateGroundedAnswer = async (systemInstruction, prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Valid prompt is required to generate an answer.');
  }

  // Use a capable generative model. gemini-3.6-flash is fast and good at following system instructions.
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.1, // Low temperature for more factual, less creative responses
      topP: 0.8,
    },
  });

  if (!response.text) {
    throw new Error('Invalid response from Gemini Generation API.');
  }

  return response.text;
};
