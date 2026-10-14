
const Notification = require("../models/Notification");

// =====================================
// GET ALL MY NOTIFICATIONS
// =====================================
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .populate("sender", "name email")
            .populate("relatedProduct", "title images")
            .sort({ createdAt: -1 });

        // Handle deleted sender accounts and products safely.
        const safeNotifications = notifications.map(notification => {
            const data = notification.toObject();

            if (!data.sender) {
                data.sender = {
                    name: "Deleted User",
                    email: null
                };
            }

            if (!data.relatedProduct) {
                data.relatedProduct = null;
            }

            return data;
        });

        return res.status(200).json({
            success: true,
            count: safeNotifications.length,
            notifications: safeNotifications
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });
    }
};

// =====================================
// GET UNREAD NOTIFICATION COUNT
// =====================================
const getUnreadNotificationCount = async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error("Unread notification count error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch unread notification count"
        });
    }
};

// =====================================
// MARK ONE NOTIFICATION AS READ
// =====================================
const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark notification as read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update notification"
        });
    }
};

// =====================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================
const markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Mark all notifications as read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read"
        });
    }
};

module.exports = {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
};