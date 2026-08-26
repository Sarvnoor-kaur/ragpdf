import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import { generateRAGAnswer } from '../services/ragService.js';

/**
 * Generate a short clean title from the user's first question.
 * Truncates nicely to max ~40 chars.
 */
const generateTitleFromQuestion = (question) => {
  if (!question) return 'New Chat';
  let title = question.trim().replace(/^["']|["']$/g, '');
  if (title.length > 35) {
    title = title.substring(0, 35).trim() + '...';
  }
  return title.charAt(0).toUpperCase() + title.slice(1);
};

// ============================================================
// POST /api/chat
// Access: Authenticated users
// Creates a new empty conversation
// ============================================================
export const createConversation = async (req, res) => {
  try {
    const conversation = await Conversation.create({
      userId: req.user._id,
      title: 'New Chat',
      messages: [],
    });

    return res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('[Chat Controller Error - createConversation]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create new conversation.',
    });
  }
};

// ============================================================
// GET /api/chat
// Access: Authenticated users
// Gets all conversations belonging to the authenticated user
// ============================================================
export const getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .select('title updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('[Chat Controller Error - getUserConversations]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations.',
    });
  }
};

// ============================================================
// GET /api/chat/:id
// Access: Authenticated users (owner only)
// Gets a single conversation with its message history
// ============================================================
export const getConversationById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
  }

  try {
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // User Isolation Check
    if (conversation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this conversation.',
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('[Chat Controller Error - getConversationById]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation.',
    });
  }
};

// ============================================================
// POST /api/chat/:id/message
// Access: Authenticated users (owner only)
// Processes question through RAG pipeline & appends to history
// ============================================================
export const sendMessage = async (req, res) => {
  const { id } = req.params;
  const { question } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
  }

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ success: false, message: 'Question is required.' });
  }

  if (question.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Question must be at least 3 characters long.' });
  }

  if (question.trim().length > 1000) {
    return res.status(400).json({ success: false, message: 'Question must not exceed 1000 characters.' });
  }

  try {
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // User Isolation Check
    if (conversation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this conversation.',
      });
    }

    // 1. Run RAG Pipeline
    const { answer, sources } = await generateRAGAnswer(question.trim());

    // 2. Add user message
    conversation.messages.push({
      role: 'user',
      content: question.trim(),
      sources: [],
    });

    // 3. Add assistant response message with sources
    conversation.messages.push({
      role: 'assistant',
      content: answer,
      sources: sources || [],
    });

    // 4. Update title if first question or default title
    if (conversation.title === 'New Chat' || conversation.messages.length <= 2) {
      conversation.title = generateTitleFromQuestion(question);
    }

    await conversation.save();

    console.log(`[RAG] Conversation ${id} updated with new response.`);

    return res.status(200).json({
      success: true,
      answer,
      sources,
      conversation,
    });
  } catch (error) {
    console.error('[Chat Controller Error - sendMessage]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process message and generate answer.',
    });
  }
};

// ============================================================
// DELETE /api/chat/:id
// Access: Authenticated users (owner only)
// Deletes a conversation
// ============================================================
export const deleteConversation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
  }

  try {
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // User Isolation Check
    if (conversation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this conversation.',
      });
    }

    await Conversation.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (error) {
    console.error('[Chat Controller Error - deleteConversation]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation.',
    });
  }
};
