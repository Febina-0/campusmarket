
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const EmailVerification = require("../models/EmailVerification");
const cloudinary = require("../config/cloudinary");

router.use(protect, adminOnly);

// =====================================
// HELPERS
// =====================================

const getObjectIds = (documents) =>
    documents.map((document) => document._id);

const getImageIds = (products) =>
    products.flatMap((product) =>
        (product.images || [])
            .map((image) => image.public_id)
            .filter(Boolean)
    );

const cleanupCloudinaryImages = async (imageIds) => {
    const results = await Promise.allSettled(
        [...new Set(imageIds)].map((id) =>
            cloudinary.uploader.destroy(id)
        )
    );

    return results.some((result) =>
        result.status === "rejected" ||
        !["ok", "not found"].includes(
            result.value?.result
        )
    );
};

// =====================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// =====================================

router.get("/dashboard", async (req, res) => {
    try {
        const [
            totalUsers,
            totalProducts,
            availableProducts,
            reservedProducts,
            soldProducts
        ] = await Promise.all([
            User.countDocuments({
                role: "user",
                isDeleted: { $ne: true }
            }),

            Product.countDocuments(),

            Product.countDocuments({
                status: "Available"
            }),

            Product.countDocuments({
                status: "Reserved"
            }),

            Product.countDocuments({
                status: "Sold"
            })
        ]);

        return res.status(200).json({
            success: true,
            admin: {
                name: req.user.name,
                email: req.user.email
            },
            statistics: {
                totalUsers,
                totalProducts,
                availableProducts,
                reservedProducts,
                soldProducts
            }
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard statistics"
        });
    }
});

// =====================================
// GET ALL STUDENTS
// GET /api/admin/users
// =====================================

router.get("/users", async (req, res) => {
    try {
        const users = await User.find({
            role: "user",
            isDeleted: { $ne: true }
        })
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error("Admin users error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users"
        });
    }
});

// =====================================
// GET ALL PRODUCTS
// GET /api/admin/products
// =====================================

router.get("/products", async (req, res) => {
    try {
        const products = await Product.find()
            .populate("seller", "name email role isDeleted")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error("Admin products error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve products"
        });
    }
});

// =====================================
// GET A STUDENT'S PRODUCTS
// GET /api/admin/users/:userId/products
// =====================================

router.get("/users/:userId/products", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const student = await User.findOne({
            _id: userId,
            role: "user",
            isDeleted: { $ne: true }
        }).select("-password");

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student account not found"
            });
        }

        const products = await Product.find({
            seller: student._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            student,
            count: products.length,
            products
        });
    } catch (error) {
        console.error("Student products error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve student products"
        });
    }
});

// =====================================
// PERMANENTLY DELETE PRODUCT + RELATED DATA
// DELETE /api/admin/products/:productId
// =====================================

router.delete("/products/:productId", async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid product ID"
        });
    }

    let session;
    let imageIds = [];

    try {
        session = await mongoose.startSession();
        session.startTransaction();

        const product = await Product.findById(productId)
            .session(session);

        if (!product) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        imageIds = getImageIds([product]);

        // Find reservations for the product.
        const reservations = await Reservation.find({
            product: product._id
        })
            .select("_id")
            .session(session);

        const reservationIds = getObjectIds(reservations);

        // Find conversations for the product.
        const conversations = await Conversation.find({
            product: product._id
        })
            .select("_id")
            .session(session);

        const conversationIds = getObjectIds(conversations);

        // Find related orders BEFORE deleting them.
        const orderConditions = [
            { product: product._id }
        ];

        if (reservationIds.length) {
            orderConditions.push({
                reservation: { $in: reservationIds }
            });
        }

        const linkedOrders = await Order.find({
            $or: orderConditions
        })
            .select("_id")
            .session(session);

        const orderIds = getObjectIds(linkedOrders);

        // Delete notifications referencing affected records.
        const notificationConditions = [
            { relatedProduct: product._id }
        ];

        if (reservationIds.length) {
            notificationConditions.push({
                relatedReservation: { $in: reservationIds }
            });
        }

        if (conversationIds.length) {
            notificationConditions.push({
                relatedConversation: { $in: conversationIds }
            });
        }

        if (orderIds.length) {
            notificationConditions.push({
                relatedOrder: { $in: orderIds }
            });
        }

        const notificationResult = await Notification.deleteMany({
            $or: notificationConditions
        }).session(session);

        // Delete orders connected to the product/reservations.
        const orderResult = await Order.deleteMany({
            $or: orderConditions
        }).session(session);

        // Delete messages before conversations.
        let messageResult = { deletedCount: 0 };

        if (conversationIds.length) {
            messageResult = await Message.deleteMany({
                conversation: { $in: conversationIds }
            }).session(session);
        }

        const conversationResult = await Conversation.deleteMany({
            _id: { $in: conversationIds }
        }).session(session);

        // Remove the product from all wishlists.
        await User.updateMany(
            { wishlist: product._id },
            { $pull: { wishlist: product._id } },
            { session }
        );

        const reservationResult = await Reservation.deleteMany({
            _id: { $in: reservationIds }
        }).session(session);

        // Permanently delete the product.
        const productResult = await Product.deleteOne({
            _id: product._id
        }).session(session);

        if (productResult.deletedCount !== 1) {
            throw new Error("Product could not be deleted");
        }

        await session.commitTransaction();

        // Delete external Cloudinary images after DB commit.
        const imageCleanupPending =
            await cleanupCloudinaryImages(imageIds);

        return res.status(200).json({
            success: true,
            message: imageCleanupPending
                ? "Product and related records deleted. Some images require cleanup."
                : "Product and related records permanently deleted.",
            deleted: {
                product: productResult.deletedCount,
                orders: orderResult.deletedCount,
                reservations: reservationResult.deletedCount,
                conversations: conversationResult.deletedCount,
                messages: messageResult.deletedCount,
                notifications: notificationResult.deletedCount
            },
            imageCleanupPending
        });
    } catch (error) {
        if (session?.inTransaction()) {
            await session.abortTransaction();
        }

        console.error("Admin product deletion error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete product and related records"
        });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
});

// =====================================
// PERMANENTLY DELETE STUDENT + RELATED DATA
// DELETE /api/admin/users/:userId
// =====================================

router.delete("/users/:userId", async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }

    if (String(userId) === String(req.user._id)) {
        return res.status(400).json({
            success: false,
            message: "You cannot delete your own admin account here"
        });
    }

    let session;
    let imageIds = [];

    try {
        session = await mongoose.startSession();
        session.startTransaction();

        const student = await User.findOne({
            _id: userId,
            role: "user"
        }).session(session);

        if (!student) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Student account not found"
            });
        }

        const studentId = student._id;
        const studentEmail = student.email;

        // Find products owned by this student.
        const products = await Product.find({
            seller: studentId
        })
            .select("_id images")
            .session(session);

        const productIds = getObjectIds(products);

        imageIds = getImageIds(products);

        // Find reservations involving the student or their products.
        const reservationConditions = [
            { buyer: studentId },
            { seller: studentId }
        ];

        if (productIds.length) {
            reservationConditions.push({
                product: { $in: productIds }
            });
        }

        const reservations = await Reservation.find({
            $or: reservationConditions
        })
            .select("_id")
            .session(session);

        const reservationIds = getObjectIds(reservations);

        // Find conversations involving the student or their products.
        const conversationConditions = [
            { participants: studentId }
        ];

        if (productIds.length) {
            conversationConditions.push({
                product: { $in: productIds }
            });
        }

        const conversations = await Conversation.find({
            $or: conversationConditions
        })
            .select("_id")
            .session(session);

        const conversationIds = getObjectIds(conversations);

        // Find orders connected to the student, products or reservations.
        const orderConditions = [
            { buyer: studentId },
            { seller: studentId }
        ];

        if (productIds.length) {
            orderConditions.push({
                product: { $in: productIds }
            });
        }

        if (reservationIds.length) {
            orderConditions.push({
                reservation: { $in: reservationIds }
            });
        }

        const linkedOrders = await Order.find({
            $or: orderConditions
        })
            .select("_id")
            .session(session);

        const orderIds = getObjectIds(linkedOrders);

        // Delete notifications linked to this student or their records.
        const notificationConditions = [
            { recipient: studentId },
            { sender: studentId }
        ];

        if (productIds.length) {
            notificationConditions.push({
                relatedProduct: { $in: productIds }
            });
        }

        if (reservationIds.length) {
            notificationConditions.push({
                relatedReservation: { $in: reservationIds }
            });
        }

        if (conversationIds.length) {
            notificationConditions.push({
                relatedConversation: { $in: conversationIds }
            });
        }

        if (orderIds.length) {
            notificationConditions.push({
                relatedOrder: { $in: orderIds }
            });
        }

        const notificationResult = await Notification.deleteMany({
            $or: notificationConditions
        }).session(session);

        // Delete orders before their referenced reservations.
        const orderResult = await Order.deleteMany({
            $or: orderConditions
        }).session(session);

        // Delete messages before conversations.
        let messageResult = { deletedCount: 0 };

        if (conversationIds.length) {
            messageResult = await Message.deleteMany({
                conversation: { $in: conversationIds }
            }).session(session);
        }

        const conversationResult = await Conversation.deleteMany({
            _id: { $in: conversationIds }
        }).session(session);

        // Remove owned products from every wishlist.
        if (productIds.length) {
            await User.updateMany(
                { wishlist: { $in: productIds } },
                { $pull: { wishlist: { $in: productIds } } },
                { session }
            );
        }

        const reservationResult = await Reservation.deleteMany({
            _id: { $in: reservationIds }
        }).session(session);

        // Permanently delete the student's products.
        const productResult = await Product.deleteMany({
            seller: studentId
        }).session(session);

        // Remove verification records for this student's email.
        await EmailVerification.deleteMany({
            email: studentEmail
        }).session(session);

        // Permanently delete the student account.
        const studentResult = await User.deleteOne({
            _id: studentId,
            role: "user"
        }).session(session);

        if (studentResult.deletedCount !== 1) {
            throw new Error("Student account could not be deleted");
        }

        await session.commitTransaction();

        // Delete external images after the database commit.
        const imageCleanupPending =
            await cleanupCloudinaryImages(imageIds);

        return res.status(200).json({
            success: true,
            message: imageCleanupPending
                ? "Student and related records deleted. Some images require cleanup."
                : "Student and related records permanently deleted.",
            deleted: {
                student: studentResult.deletedCount,
                products: productResult.deletedCount,
                orders: orderResult.deletedCount,
                reservations: reservationResult.deletedCount,
                conversations: conversationResult.deletedCount,
                messages: messageResult.deletedCount,
                notifications: notificationResult.deletedCount
            },
            imageCleanupPending
        });
    } catch (error) {
        if (session?.inTransaction()) {
            await session.abortTransaction();
        }

        console.error("Admin student deletion error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete student and related records"
        });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
});

module.exports = router;