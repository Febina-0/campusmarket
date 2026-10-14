
const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Order = require("../models/Order");

const notifyWishlistUsers = require(
    "../utils/notifyWishlistUsers"
);

// ========================================
// HELPER: SEND NOTIFICATION
// ========================================
const sendNotification = async ({
    req,
    recipient,
    sender,
    type = "reservation",
    title,
    message,
    productId,
    reservationId,
    orderId
}) => {
    // Skip notifications for permanently deleted recipients.
    const recipientExists = await User.exists({
        _id: recipient
    });

    if (!recipientExists) return null;

    const notification = await Notification.create({
        recipient,
        sender,
        type,
        title,
        message,
        ...(productId && { relatedProduct: productId }),
        ...(reservationId && {
            relatedReservation: reservationId
        }),
        ...(orderId && { relatedOrder: orderId })
    });

    const io = req.app.get("io");

    if (io) {
        io.to(recipient.toString()).emit(
            "new_notification",
            notification
        );
    }

    return notification;
};

// ========================================
// HELPER: CHECK OBJECT ID
// ========================================
const isValidId = (id) =>
    mongoose.isValidObjectId(id);

// ========================================
// HELPER: RESTORE PRODUCT IF APPROPRIATE
// ========================================
const restoreProductIfAvailable = async (productId) => {
    const otherActiveReservation = await Reservation.exists({
        product: productId,
        status: {
            $in: ["PendingSeller", "Accepted"]
        }
    });

    if (otherActiveReservation) return null;

    const product = await Product.findById(productId);

    // Never restore a deleted or sold product.
    if (!product || product.status === "Sold") {
        return null;
    }

    product.status = "Available";
    await product.save();

    return product;
};

// ========================================
// CREATE RESERVATION
// ========================================
const createReservation = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!isValidId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const seller = await User.findOne({
            _id: product.seller,
            role: "user"
        });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "This seller account is no longer available"
            });
        }

        if (product.seller.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot reserve your own product"
            });
        }

        if (product.status !== "Available") {
            return res.status(400).json({
                success: false,
                message: "Product is currently not available"
            });
        }

        // Prevent duplicate active reservations by the same buyer.
        const existingReservation = await Reservation.exists({
            product: product._id,
            buyer: req.user._id,
            status: {
                $in: ["PendingSeller", "Accepted"]
            }
        });

        if (existingReservation) {
            return res.status(409).json({
                success: false,
                message: "You already have an active reservation for this product"
            });
        }

        // Conditional update prevents two buyers reserving the same
        // Available product at the same time.
        const updatedProduct = await Product.findOneAndUpdate(
            {
                _id: product._id,
                status: "Available"
            },
            {
                $set: { status: "Reserved" }
            },
            {
                new: true
            }
        );

        if (!updatedProduct) {
            return res.status(409).json({
                success: false,
                message: "Product is no longer available"
            });
        }

        let reservation;

        try {
            reservation = await Reservation.create({
                product: product._id,
                buyer: req.user._id,
                seller: seller._id,
                status: "PendingSeller",
                expiresAt: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                )
            });
        } catch (error) {
            // Restore only if no other active reservation exists.
            await restoreProductIfAvailable(product._id);
            throw error;
        }

        await sendNotification({
            req,
            recipient: seller._id,
            sender: req.user._id,
            title: "New Reservation Request",
            message: `${req.user.name} reserved your product: ${product.title}`,
            productId: product._id,
            reservationId: reservation._id
        });

        return res.status(201).json({
            success: true,
            message: "Product reserved successfully. Waiting for seller response.",
            reservation
        });
    } catch (error) {
        console.error("Create reservation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to reserve product"
        });
    }
};

// ========================================
// ACCEPT RESERVATION
// ========================================
const acceptReservation = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reservation ID"
            });
        }

        const reservation = await Reservation.findById(
            req.params.id
        ).populate("product");

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found"
            });
        }

        if (reservation.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to accept this reservation"
            });
        }

        if (reservation.status !== "PendingSeller") {
            return res.status(400).json({
                success: false,
                message: "This reservation cannot be accepted"
            });
        }

        const product = reservation.product;

        if (!product) {
            reservation.status = "Cancelled";
            await reservation.save();

            return res.status(404).json({
                success: false,
                message: "The product no longer exists"
            });
        }

        const [buyerExists, sellerExists] = await Promise.all([
            User.exists({ _id: reservation.buyer }),
            User.exists({ _id: reservation.seller })
        ]);

        if (!buyerExists || !sellerExists) {
            return res.status(400).json({
                success: false,
                message: "A participant account no longer exists"
            });
        }

        if (
            reservation.expiresAt &&
            reservation.expiresAt <= new Date()
        ) {
            reservation.status = "Expired";
            await reservation.save();

            const restoredProduct = await restoreProductIfAvailable(
                product._id
            );

            if (restoredProduct) {
                await notifyWishlistUsers(
                    restoredProduct,
                    "is available again!",
                    req.app.get("io")
                );
            }

            return res.status(400).json({
                success: false,
                message: "This reservation has expired"
            });
        }

        if (product.status === "Sold") {
            return res.status(400).json({
                success: false,
                message: "This product has already been sold"
            });
        }

        // Change status only if it is still pending.
        reservation.status = "Accepted";
        reservation.acceptedAt = new Date();
        reservation.expiresAt = null;

        await reservation.save();

        let order = await Order.findOne({
            reservation: reservation._id
        });

        if (!order) {
            order = await Order.create({
                reservation: reservation._id,
                product: product._id,
                buyer: reservation.buyer,
                seller: reservation.seller,
                amount: product.price,
                paymentMethod: null,
                paymentStatus: "NotSelected",
                orderStatus: "AwaitingPaymentMethod"
            });
        }

        product.status = "Reserved";
        await product.save();

        await sendNotification({
            req,
            recipient: reservation.buyer,
            sender: req.user._id,
            title: "Reservation Accepted",
            message: `Your reservation for ${product.title} was accepted. Please choose Cash on Pickup.`,
            productId: product._id,
            reservationId: reservation._id,
            orderId: order._id
        });

        return res.status(200).json({
            success: true,
            message: "Reservation accepted and order created successfully.",
            reservation,
            order
        });
    } catch (error) {
        console.error("Accept reservation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to accept reservation"
        });
    }
};

// ========================================
// REJECT RESERVATION
// ========================================
const rejectReservation = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reservation ID"
            });
        }

        const reservation = await Reservation.findById(
            req.params.id
        ).populate("product");

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found"
            });
        }

        if (reservation.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to reject this reservation"
            });
        }

        if (reservation.status !== "PendingSeller") {
            return res.status(400).json({
                success: false,
                message: "This reservation cannot be rejected"
            });
        }

        reservation.status = "Rejected";
        await reservation.save();

        const product = await restoreProductIfAvailable(
            reservation.product?._id || reservation.product
        );

        if (product) {
            await notifyWishlistUsers(
                product,
                "is available again!",
                req.app.get("io")
            );
        }

        await sendNotification({
            req,
            recipient: reservation.buyer,
            sender: req.user._id,
            title: "Reservation Rejected",
            message: `Your reservation for ${product?.title || "the product"} was rejected.`,
            productId: product?._id,
            reservationId: reservation._id
        });

        return res.status(200).json({
            success: true,
            message: "Reservation rejected.",
            reservation
        });
    } catch (error) {
        console.error("Reject reservation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to reject reservation"
        });
    }
};

// ========================================
// BUYER CANCELS RESERVATION
// ========================================
const cancelReservation = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reservation ID"
            });
        }

        const reservation = await Reservation.findById(
            req.params.id
        ).populate("product");

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found"
            });
        }

        if (reservation.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to cancel this reservation"
            });
        }

        if (!["PendingSeller", "Accepted"].includes(reservation.status)) {
            return res.status(400).json({
                success: false,
                message: "This reservation cannot be cancelled"
            });
        }

        const order = await Order.findOne({
            reservation: reservation._id
        });

        if (order) {
            if (
                order.paymentStatus === "Paid" ||
                order.orderStatus === "Completed" ||
                order.orderStatus === "HandedOver"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "This order can no longer be cancelled"
                });
            }

            order.orderStatus = "Cancelled";
            await order.save();
        }

        reservation.status = "Cancelled";
        await reservation.save();

        const product = await restoreProductIfAvailable(
            reservation.product?._id || reservation.product
        );

        if (product) {
            await notifyWishlistUsers(
                product,
                "is available again!",
                req.app.get("io")
            );
        }

        await sendNotification({
            req,
            recipient: reservation.seller,
            sender: req.user._id,
            title: "Reservation Cancelled",
            message: `The buyer cancelled the reservation for ${product?.title || "the product"}.`,
            productId: product?._id,
            reservationId: reservation._id,
            orderId: order?._id
        });

        return res.status(200).json({
            success: true,
            message: "Reservation cancelled.",
            reservation
        });
    } catch (error) {
        console.error("Cancel reservation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel reservation"
        });
    }
};

// ========================================
// GET BUYER'S RESERVATIONS
// ========================================
const getMyReservations = async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {
            buyer: req.user._id
        };

        if (status) {
            filter.status = status;
        }

        const reservations = await Reservation.find(filter)
            .populate("product", "title price images status")
            .populate("seller", "name email phone")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reservations.length,
            reservations
        });
    } catch (error) {
        console.error("Get buyer reservations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your reservations"
        });
    }
};

// ========================================
// GET SELLER'S INCOMING RESERVATIONS
// ========================================
const getIncomingReservations = async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {
            seller: req.user._id
        };

        if (status) {
            filter.status = status;
        }

        const reservations = await Reservation.find(filter)
            .populate("product", "title price images status")
            .populate("buyer", "name email phone")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reservations.length,
            reservations
        });
    } catch (error) {
        console.error("Get incoming reservations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch incoming reservations"
        });
    }
};

module.exports = {
    createReservation,
    acceptReservation,
    rejectReservation,
    cancelReservation,
    getMyReservations,
    getIncomingReservations
};