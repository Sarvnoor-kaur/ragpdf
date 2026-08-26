import API from './api';

/**
 * Creates a new empty conversation.
 */
export const createConversation = () => {
  return API.post('/chat');
};

/**
 * Gets all conversations for the current authenticated user.
 */
export const getUserConversations = () => {
  return API.get('/chat');
};

/**
 * Gets a single conversation with its message history by ID.
 * @param {string} id - Conversation ID
 */
export const getConversation = (id) => {
  return API.get(`/chat/${id}`);
};

/**
 * Sends a question in a conversation, triggers RAG, and saves messages.
 * @param {string} conversationId - Conversation ID
 * @param {string} question - The user's question
 */
export const sendMessage = (conversationId, question) => {
  return API.post(`/chat/${conversationId}/message`, { question });
};

/**
 * Deletes a conversation by ID.
 * @param {string} id - Conversation ID
 */
export const deleteConversation = (id) => {
  return API.delete(`/chat/${id}`);
};
