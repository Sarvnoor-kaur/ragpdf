import API from './api';

/**
 * Asks a question to the RAG backend.
 * 
 * @param {string} question - The user's question.
 * @returns {Promise<Object>} - The generated answer and sources.
 */
export const askQuestion = (question) => {
  return API.post('/rag/ask', { question });
};
