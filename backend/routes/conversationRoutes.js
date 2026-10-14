const express = require("express");
const router = express.Router();
const {
    startConversation,
    getMyConversations
} = require("../controllers/conversationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getMyConversations);
router.post("/:productId", startConversation);

module.exports = router;
