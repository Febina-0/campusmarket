
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        // Reservation that created this order.
        // Preserve the reservation when an order references it.
        reservation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation",
            required: true,
            unique: true
        },

        // Product associated with the order.
        // Preserve historical product records when necessary.
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        // Buyer who placed the order.
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Seller who listed the product.
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Price recorded when the order was created.
        amount: {
            type: Number,
            required: true,
            min: 0
        },

        // Payment method selected by the buyer.
        // This project currently uses Cash on Pickup.
        paymentMethod: {
            type: String,
            enum: ["CashOnPickup", "UPI"],
            default: null
        },

        // Payment state.
        paymentStatus: {
            type: String,
            enum: [
                "NotSelected",
                "Pending",
                "Paid",
                "Failed",
                "CashPending"
            ],
            default: "NotSelected"
        },

        // Order lifecycle.
        orderStatus: {
            type: String,
            enum: [
                "AwaitingPaymentMethod",
                "AwaitingPayment",
                "ReadyForPickup",
                "HandedOver",
                "Completed",
                "Cancelled"
            ],
            default: "AwaitingPaymentMethod"
        },

        // Optional payment gateway transaction reference.
        paymentTransactionId: {
            type: String,
            default: null,
            trim: true
        },

        // Time payment was completed.
        paidAt: {
            type: Date,
            default: null
        },

        // Time seller handed over the product.
        handedOverAt: {
            type: Date,
            default: null
        },

        // Time buyer confirmed receipt.
        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Useful for retrieving a user's purchase and sales history.
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });

// Retrieve orders associated with a product.
orderSchema.index({ product: 1 });


module.exports = mongoose.model("Order", orderSchema);