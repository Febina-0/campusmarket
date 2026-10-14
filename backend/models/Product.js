
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        condition: {
            type: String,
            enum: ["New", "Like New", "Good", "Fair", "Poor"],
            default: "Good"
        },

        images: [
            {
                url: {
                    type: String,
                    required: true
                },

                public_id: {
                    type: String,
                    required: true
                }
            }
        ],

        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        status: {
            type: String,
            enum: ["Available", "Reserved", "Sold"],
            default: "Available",
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Supports filtering by status and sorting newest products first.
productSchema.index({
    status: 1,
    createdAt: -1
});

module.exports = mongoose.model("Product", productSchema);