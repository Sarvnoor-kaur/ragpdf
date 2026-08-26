import { generateRAGAnswer } from '../services/ragService.js';

// ============================================================
// POST /api/rag/ask
// Access: admin, hr, employee
// ============================================================
export const askQuestion = async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'A valid question is required.',
    });
  }

  if (question.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Question must be at least 3 characters long.',
    });
  }

  if (question.trim().length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Question must not exceed 1000 characters.',
    });
  }

  try {
    const { answer, sources } = await generateRAGAnswer(question.trim());

    return res.status(200).json({
      success: true,
      data: {
        question: question.trim(),
        answer,
        sources,
      },
    });
  } catch (error) {
    console.error('[RAG Controller Error]:', error.message);
    
    // Return a generic error to the client to avoid leaking internals
    return res.status(500).json({
      success: false,
      message: 'Sorry, I couldn\'t process your question right now. Please try again later.',
    });
  }
};
