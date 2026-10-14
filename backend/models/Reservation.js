
const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
    {
        // Product being reserved.
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true
        },

        // Student who requested the reservation.
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Student selling the product.
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Reservation lifecycle.
        status: {
            type: String,
            enum: [
                "PendingSeller",
                "Accepted",
                "Rejected",
                "Cancelled",
                "Expired"
            ],
            default: "PendingSeller",
            index: true
        },

        // When the seller accepted the reservation.
        acceptedAt: {
            type: Date,
            default: null
        },

        // Deadline for the seller to respond.
        expiresAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Support buyer reservation history.
reservationSchema.index({
    buyer: 1,
    createdAt: -1
});

// Support seller's incoming reservations.
reservationSchema.index({
    seller: 1,
    createdAt: -1
});

// Support reservation expiry-job queries.
reservationSchema.index({
    status: 1,
    expiresAt: 1
});

module.exports = mongoose.model(
    "Reservation",
    reservationSchema
);