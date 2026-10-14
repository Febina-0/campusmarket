
const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");
const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");

// =====================================
// CREATE PRODUCT
// =====================================
const createProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            category,
            condition
        } = req.body;

        if (
            !title?.trim() ||
            !description?.trim() ||
            price === undefined ||
            price === "" ||
            !category?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, description, price and category are required"
            });
        }

        const numericPrice = Number(price);

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid non-negative number"
            });
        }

        const sellerExists = await User.exists({
            _id: req.user._id,
            role: "user"
        });

        if (!sellerExists) {
            return res.status(403).json({
                success: false,
                message: "Only an active student account can create listings"
            });
        }

        const images = (req.files || []).map(file => ({
            url: file.path,
            public_id: file.filename
        }));

        const product = await Product.create({
            title: title.trim(),
            description: description.trim(),
            price: numericPrice,
            category: category.trim(),
            condition,
            images,
            seller: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });
    } catch (error) {
        console.error("CREATE PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Product creation failed"
        });
    }
};

// =====================================
// GET ALL PUBLIC PRODUCTS
// =====================================
const getProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            condition
        } = req.query;

        const filter = {};

        // Exclude products whose seller no longer exists.
        const existingUsers = await User.find({
            role: "user"
        }).select("_id");

        filter.seller = {
            $in: existingUsers.map(user => user._id)
        };

        if (search?.trim()) {
            const escapedSearch = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                {
                    title: {
                        $regex: escapedSearch,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: escapedSearch,
                        $options: "i"
                    }
                }
            ];
        }

        if (category) {
            filter.category = category;
        }

        if (condition) {
            filter.condition = condition;
        }

        if (minPrice !== undefined && minPrice !== "") {
            const minimum = Number(minPrice);

            if (!Number.isFinite(minimum) || minimum < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid minimum price"
                });
            }

            filter.price = {
                ...filter.price,
                $gte: minimum
            };
        }

        if (maxPrice !== undefined && maxPrice !== "") {
            const maximum = Number(maxPrice);

            if (!Number.isFinite(maximum) || maximum < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid maximum price"
                });
            }

            filter.price = {
                ...filter.price,
                $lte: maximum
            };
        }

        if (
            filter.price?.$gte !== undefined &&
            filter.price?.$lte !== undefined &&
            filter.price.$gte > filter.price.$lte
        ) {
            return res.status(400).json({
                success: false,
                message: "Minimum price cannot exceed maximum price"
            });
        }

        const products = await Product.find(filter)
            .populate("seller", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error("GET PRODUCTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};

// =====================================
// GET PRODUCT BY ID
// =====================================
const getProductById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(req.params.id)
            .populate("seller", "name email phone");

        if (
            !product ||
            !product.seller ||
            product.seller.role === "admin"
        ) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error("GET PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};

// =====================================
// UPDATE PRODUCT
// =====================================
const updateProduct = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (
            product.seller.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this product"
            });
        }

        const {
            title,
            description,
            price,
            category,
            condition,
            status
        } = req.body;

        // Reservation and order controllers manage status.
        if (status !== undefined) {
            return res.status(400).json({
                success: false,
                message: "Product status cannot be changed through this endpoint"
            });
        }

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Title cannot be empty"
                });
            }

            product.title = title.trim();
        }

        if (description !== undefined) {
            if (
                typeof description !== "string" ||
                !description.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Description cannot be empty"
                });
            }

            product.description = description.trim();
        }

        if (price !== undefined) {
            const numericPrice = Number(price);

            if (!Number.isFinite(numericPrice) || numericPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Price must be a valid non-negative number"
                });
            }

            product.price = numericPrice;
        }

        if (category !== undefined) {
            if (typeof category !== "string" || !category.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Category cannot be empty"
                });
            }

            product.category = category.trim();
        }

        if (condition !== undefined) {
            product.condition = condition;
        }

        const oldImages = product.images || [];
        const newImages = (req.files || []).map(file => ({
            url: file.path,
            public_id: file.filename
        }));

        if (newImages.length > 0) {
            product.images = newImages;
        }

        const updatedProduct = await product.save();

        // Clean up old images only after the database save succeeds.
        if (newImages.length > 0) {
            for (const image of oldImages) {
                if (!image.public_id) continue;

                try {
                    await cloudinary.uploader.destroy(image.public_id);
                } catch (imageError) {
                    console.error(
                        "Old image cleanup failed:",
                        image.public_id,
                        imageError.message
                    );
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct
        });
    } catch (error) {
        console.error("UPDATE PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Product update failed"
        });
    }
};

// =====================================
// DELETE PRODUCT (SELLER)
// =====================================
const deleteProduct = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (
            product.seller.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this product"
            });
        }

        // Preserve completed and ongoing order history.
        const hasOrders = await Order.exists({
            product: product._id
        });

        if (hasOrders) {
            return res.status(409).json({
                success: false,
                message: "This product has order history and cannot be permanently deleted."
            });
        }

        const reservations = await Reservation.find({
            product: product._id
        }).select("_id");

        const reservationIds = reservations.map(
            reservation => reservation._id
        );

        if (reservationIds.length > 0) {
            const hasReservationOrders = await Order.exists({
                reservation: { $in: reservationIds }
            });

            if (hasReservationOrders) {
                return res.status(409).json({
                    success: false,
                    message: "This product has order history and cannot be permanently deleted."
                });
            }
        }

        // Deleting the product without removing its conversation
        // would leave conversation references pointing to nothing.
        const conversations = await Conversation.find({
            product: product._id
        }).select("_id");

        const conversationIds = conversations.map(
            conversation => conversation._id
        );

        if (conversationIds.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This product is linked to conversations. Delete the related conversations first if you also want to remove their message history."
            });
        }

        // Remove related notifications and reservations.
        await Notification.deleteMany({
            relatedProduct: product._id
        });

        if (reservationIds.length > 0) {
            await Notification.deleteMany({
                relatedReservation: { $in: reservationIds }
            });

            await Reservation.deleteMany({
                _id: { $in: reservationIds }
            });
        }

        // Delete the database document before image cleanup.
        await product.deleteOne();

        const cleanupErrors = [];

        for (const image of product.images || []) {
            if (!image.public_id) continue;

            try {
                const result = await cloudinary.uploader.destroy(
                    image.public_id
                );

                if (
                    result.result !== "ok" &&
                    result.result !== "not found"
                ) {
                    cleanupErrors.push(image.public_id);
                }
            } catch (imageError) {
                console.error(
                    "Cloudinary image cleanup failed:",
                    image.public_id,
                    imageError.message
                );

                cleanupErrors.push(image.public_id);
            }
        }

        return res.status(200).json({
            success: true,
            message: cleanupErrors.length
                ? "Product deleted, but some images could not be removed from Cloudinary"
                : "Product and related reservation records deleted successfully",
            cleanupPending: cleanupErrors.length > 0
        });
    } catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Product deletion failed"
        });
    }
};

// =====================================
// GET MY PRODUCTS
// =====================================
const getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({
            seller: req.user._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error("GET MY PRODUCTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your products"
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getMyProducts
};