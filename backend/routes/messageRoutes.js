const express = require("express");
const router = express.Router();
const {
    sendMessage,
    getMessages,
    markMessagesAsRead
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/:conversationId", getMessages);
router.post("/:conversationId", sendMessage);
router.patch("/:conversationId/read", markMessagesAsRead);
router.put("/:conversationId/read", markMessagesAsRead);

module.exports = router;
