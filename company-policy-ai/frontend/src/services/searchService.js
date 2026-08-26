import API from './api';

/**
 * Searches documents semantically based on a text query.
 * 
 * @param {string} query - The search query (e.g. "How many paid leaves do employees get?").
 * @returns {Promise<Object>} - Contains search results chunks.
 */
export const searchDocuments = (query) => {
  return API.get(`/search?q=${encodeURIComponent(query)}`);
};
