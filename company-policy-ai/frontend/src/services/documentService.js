import api from './api.js';

/**
 * Upload a PDF document.
 * Uses FormData so the browser/Axios sets the correct multipart boundary automatically.
 *
 * @param {FormData} formData - Must contain: file (PDF), title (string), department (string)
 * @param {function} onUploadProgress - Optional Axios progress callback
 */
export const uploadDocument = (formData, onUploadProgress) =>
  api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

/**
 * Fetch the list of all documents (metadata only, no chunk text).
 */
export const getDocuments = () => api.get('/documents');

/**
 * Fetch a single document's metadata + chunk previews by ID.
 * @param {string} id - MongoDB document ID
 */
export const getDocument = (id) => api.get(`/documents/${id}`);

/**
 * Delete a document and all its associated chunks.
 * @param {string} id - MongoDB document ID
 */
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

// Generate Embeddings
export const generateEmbeddings = (id) => api.post(`/documents/${id}/embed`);
