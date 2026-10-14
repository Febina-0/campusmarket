
const Conversation = require("../models/Conversation");
const Product = require("../models/Product");
const Message = require("../models/Message");

// =====================================
// START OR GET CONVERSATION
// =====================================
const startConversation = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const buyerId = req.user._id;
        const sellerId = product.seller;

        if (!sellerId) {
            return res.status(404).json({
                success: false,
                message: "Product seller is no longer available"
            });
        }

        if (buyerId.toString() === sellerId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot start a conversation about your own product"
            });
        }

        // Return an existing conversation even if the listing
        // is no longer available for new conversations.
        const existingConversation = await Conversation.findOne({
            product: productId,
            participants: {
                $all: [buyerId, sellerId]
            }
        });

        if (existingConversation) {
            return res.status(200).json({
                success: true,
                message: "Conversation already exists",
                conversation: existingConversation
            });
        }

        if (product.status !== "Available") {
            return res.status(400).json({
                success: false,
                message: "This product is not available for new conversations"
            });
        }

        const conversation = await Conversation.create({
            product: productId,
            participants: [buyerId, sellerId]
        });

        return res.status(201).json({
            success: true,
            message: "Conversation started successfully",
            conversation
        });
    } catch (error) {
        console.error("Start conversation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to start conversation"
        });
    }
};

// =====================================
// GET MY CONVERSATIONS
// =====================================
const getMyConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
            .populate("product", "title price images")
            .populate("participants", "name email isDeleted")
            .sort({ lastMessageAt: -1 });

        const conversationsWithUnreadCount = await Promise.all(
            conversations.map(async (conversation) => {
                const unreadCount = await Message.countDocuments({
                    conversation: conversation._id,
                    sender: { $ne: req.user._id },
                    isRead: false
                });

                const conversationData = conversation.toObject();

                conversationData.participants =
                    conversationData.participants.map((participant) => {
                        // A null participant means their User document
                        // has been permanently deleted.
                        if (!participant || participant.isDeleted) {
                            return {
                                _id: participant?._id || null,
                                name: "Deleted User",
                                email: null,
                                isDeleted: true
                            };
                        }

                        return participant;
                    });

                return {
                    ...conversationData,
                    unreadCount
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: conversations.length,
            conversations: conversationsWithUnreadCount
        });
    } catch (error) {
        console.error("Get conversations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch conversations"
        });
    }
};

module.exports = {
    startConversation,
    getMyConversations
};