import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createConversation,
  getUserConversations,
  getConversationById,
  sendMessage,
  deleteConversation,
} from '../controllers/chatController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .post(createConversation)
  .get(getUserConversations);

router.route('/:id')
  .get(getConversationById)
  .delete(deleteConversation);

router.post('/:id/message', sendMessage);

export default router;
