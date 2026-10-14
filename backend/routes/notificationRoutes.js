const express = require("express");
const router = express.Router();
const {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.patch("/read-all", markAllNotificationsAsRead);
router.put("/read-all", markAllNotificationsAsRead);
router.patch("/:id/read", markNotificationAsRead);
router.put("/:id/read", markNotificationAsRead);

module.exports = router;
