
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");

// =====================================
// SEND A MESSAGE
// =====================================
const sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { text } = req.body;

        if (typeof text !== "string" || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message text is required"
            });
        }

        if (text.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Message cannot exceed 1000 characters"
            });
        }

        const conversation = await Conversation.findById(
            conversationId
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const isParticipant = conversation.participants.some(
            participant =>
                participant.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to send messages in this conversation"
            });
        }

        // Do not allow a new message to be sent to a conversation
        // if one of its participants has been permanently deleted.
        const User = require("../models/User");

        const participants = await User.find({
            _id: { $in: conversation.participants }
        }).select("_id");

        if (
            participants.length !== conversation.participants.length
        ) {
            return res.status(403).json({
                success: false,
                message: "This conversation is read-only because a participant account was deleted."
            });
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            text: text.trim()
        });

        conversation.lastMessage = text.trim();
        conversation.lastMessageAt = new Date();

        await conversation.save();

        await message.populate("sender", "name email isDeleted");

        const messageData = message.toObject();

        if (!messageData.sender || messageData.sender.isDeleted) {
            messageData.sender = {
                _id: message.sender?._id || req.user._id,
                name: "Deleted User",
                email: null,
                isDeleted: true
            };
        }

        const recipients = conversation.participants.filter(
            participant =>
                participant.toString() !== req.user._id.toString()
        );

        const notifications = [];

        for (const recipientId of recipients) {
            // Skip notifications for users whose accounts no longer exist.
            const recipientExists = await User.exists({
                _id: recipientId
            });

            if (!recipientExists) continue;

            const notification = await Notification.create({
                recipient: recipientId,
                sender: req.user._id,
                type: "message",
                title: "New Message",
                message: `You received a new message from ${req.user.name}`,
                relatedProduct: conversation.product,
                relatedConversation: conversation._id
            });

            notifications.push(notification);
        }

        const io = req.app.get("io");

        if (io) {
            io.to(conversationId.toString()).emit(
                "new_message",
                messageData
            );

            notifications.forEach(notification => {
                io.to(notification.recipient.toString()).emit(
                    "new_notification",
                    notification
                );
            });
        }

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: messageData
        });
    } catch (error) {
        console.error("SEND MESSAGE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
};

// =====================================
// GET ALL MESSAGES
// =====================================
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(
            conversationId
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const isParticipant = conversation.participants.some(
            participant =>
                participant.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view these messages"
            });
        }

        const messages = await Message.find({
            conversation: conversationId
        })
            .populate("sender", "name email isDeleted")
            .sort({ createdAt: 1 });

        const safeMessages = messages.map(message => {
            const data = message.toObject();

            if (!data.sender || data.sender.isDeleted) {
                data.sender = {
                    _id: data.sender?._id || data.sender,
                    name: "Deleted User",
                    email: null,
                    isDeleted: true
                };
            }

            return data;
        });

        return res.status(200).json({
            success: true,
            count: safeMessages.length,
            messages: safeMessages
        });
    } catch (error) {
        console.error("GET MESSAGES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch messages"
        });
    }
};

// =====================================
// MARK MESSAGES AS READ
// =====================================
const markMessagesAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(
            conversationId
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const isParticipant = conversation.participants.some(
            participant =>
                participant.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this conversation"
            });
        }

        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: req.user._id },
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        return res.status(200).json({
            success: true,
            message: "Messages marked as read"
        });
    } catch (error) {
        console.error("MARK READ ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark messages as read"
        });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    markMessagesAsRead
};