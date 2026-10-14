const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        type: {
            type: String,
            enum: [
                "message",
                "order",
                "reservation",
                "wishlist",
                "product",
                "system"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        relatedProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        },

        relatedReservation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation"
        },

        relatedConversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation"
        },

        relatedOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order"
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);