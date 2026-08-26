import { generateEmbedding } from './geminiService.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';

export const generateChunkEmbedding = async (text) => {
  const embedding = await generateEmbedding(text);
  
  if (!embedding || !Array.isArray(embedding) || embedding.length !== 1536) {
    throw new Error('Generated embedding is invalid or has incorrect dimensionality.');
  }
  
  return {
    embedding,
    model: 'gemini-embedding-2-preview'
  };
};

export const processDocumentEmbeddings = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  try {
    document.status = 'processing';
    await document.save();

    const chunks = await Chunk.find({ documentId }).sort({ chunkNumber: 1 });
    let embeddedCount = 0;

    for (const chunk of chunks) {
      // Skip if chunk already has a valid 1536-dimensional embedding
      if (chunk.embedding && chunk.embedding.length === 1536) {
        embeddedCount++;
        continue;
      }

      const { embedding, model } = await generateChunkEmbedding(chunk.text);
      
      chunk.embedding = embedding;
      chunk.embeddingModel = model;
      await chunk.save();
      
      embeddedCount++;
      console.log(`[Embedding] Processing chunk ${embeddedCount}/${chunks.length} for doc: ${document.title}`);
    }

    document.status = 'ready';
    await document.save();
    console.log(`[Embedding] Completed: ${embeddedCount}/${chunks.length}. Document status: ready`);
    
    return {
      documentId: document._id,
      totalChunks: chunks.length,
      embeddedChunks: embeddedCount,
      failedChunks: chunks.length - embeddedCount,
      embeddingModel: 'gemini-embedding-2-preview',
      dimensions: 1536,
      status: document.status
    };
  } catch (err) {
    console.error(`[Embedding] Error processing document ${documentId}:`, err.message);
    document.status = 'failed';
    document.processingError = err.message || 'Gemini embedding request failed';
    await document.save();
    throw err;
  }
};
