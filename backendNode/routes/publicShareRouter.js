import express from 'express';
import { getPublicConversation } from '../Controller/qaController.js';

const router = express.Router();

// --- Public Share Route ---
// This route is NOT protected by auth middleware
// It handles the public URL: /:username/:conversationId

// I'm using :conversationId here as it's more standard,
// even though you mentioned msgID. This assumes you want
// to share the whole conversation.
router.get('/:username/:conversationId', getPublicConversation);

export default router;