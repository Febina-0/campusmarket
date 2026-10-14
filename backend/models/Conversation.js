
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        // Product associated with this conversation.
        // Keep the product document when historical chats
        // or orders still depend on it.
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        // Students participating in this conversation.
        // Deleted users may no longer populate successfully,
        // so controllers should handle missing user records.
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],

        lastMessage: {
            type: String,
            default: ""
        },

        lastMessageAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate conversations for the same product
// and the same two participants, regardless of their order.
conversationSchema.index(
    { product: 1, participants: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "Conversation",
    conversationSchema
);