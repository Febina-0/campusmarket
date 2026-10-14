
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");

// ========================================
// HELPER: SEND REAL-TIME NOTIFICATION
// ========================================
const sendOrderNotification = async ({
    req,
    recipient,
    sender,
    title,
    message,
    productId,
    orderId
}) => {
    // Do not create a notification for a deleted account.
    const recipientExists = await User.exists({
        _id: recipient
    });

    if (!recipientExists) {
        return;
    }

    const notification = await Notification.create({
        recipient,
        sender,
        type: "order",
        title,
        message,
        relatedProduct: productId,
        relatedOrder: orderId
    });

    const io = req.app.get("io");

    if (io) {
        io.to(recipient.toString()).emit(
            "new_notification",
            notification
        );
    }
};

// ========================================
// HELPER: GET ORDER AND CHECK PARTICIPANT
// ========================================
const findOrder = async (req, res) => {
    const { id } = req.params;

    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
        res.status(400).json({
            success: false,
            message: "Invalid order ID"
        });

        return null;
    }

    const order = await Order.findById(id);

    if (!order) {
        res.status(404).json({
            success: false,
            message: "Order not found"
        });

        return null;
    }

    return order;
};

// ========================================
// GET MY ORDERS
// ========================================
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [
                { buyer: req.user._id },
                { seller: req.user._id }
            ]
        })
            .populate("product", "title price images status")
            .populate("buyer", "name email phone")
            .populate("seller", "name email phone")
            .populate("reservation", "status acceptedAt")
            .sort({ createdAt: -1 });

        const safeOrders = orders.map(order => {
            const data = order.toObject();

            // The account may have been permanently deleted.
            if (!data.buyer) {
                data.buyer = {
                    name: "Deleted User",
                    email: null,
                    phone: ""
                };
            }

            if (!data.seller) {
                data.seller = {
                    name: "Deleted User",
                    email: null,
                    phone: ""
                };
            }

            // Preserve the historical order display if the
            // referenced product no longer exists.
            if (!data.product) {
                data.product = {
                    title: "Deleted Product",
                    price: data.amount,
                    images: [],
                    status: "Deleted"
                };
            }

            return data;
        });

        return res.status(200).json({
            success: true,
            count: safeOrders.length,
            orders: safeOrders
        });
    } catch (error) {
        console.error("Get orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
};

// ========================================
// SELECT PAYMENT METHOD
// ========================================
const selectPaymentMethod = async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        if (paymentMethod !== "CashOnPickup") {
            return res.status(400).json({
                success: false,
                message: "Only Cash on Pickup is available"
            });
        }

        const order = await findOrder(req, res);

        if (!order) return;

        // Only the buyer can select payment.
        if (order.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the buyer can select payment method"
            });
        }

        if (order.orderStatus !== "AwaitingPaymentMethod") {
            return res.status(400).json({
                success: false,
                message: "Payment method cannot be changed at this stage"
            });
        }

        // Do not allow new transactions if either participant
        // or the product has been permanently removed.
        const [buyerExists, sellerExists, product] = await Promise.all([
            User.exists({ _id: order.buyer }),
            User.exists({ _id: order.seller }),
            Product.findById(order.product)
        ]);

        if (!buyerExists || !sellerExists || !product) {
            return res.status(400).json({
                success: false,
                message: "This order cannot proceed because a participant or product no longer exists."
            });
        }

        if (product.status === "Sold") {
            return res.status(400).json({
                success: false,
                message: "This product has already been sold"
            });
        }

        order.paymentMethod = "CashOnPickup";
        order.paymentStatus = "CashPending";
        order.orderStatus = "ReadyForPickup";

        await order.save();

        await sendOrderNotification({
            req,
            recipient: order.seller,
            sender: order.buyer,
            title: "Payment Method Selected",
            message: "The buyer selected Cash on Pickup. The item is ready for pickup.",
            productId: order.product,
            orderId: order._id
        });

        return res.status(200).json({
            success: true,
            message: "Cash on Pickup selected successfully",
            order
        });
    } catch (error) {
        console.error("Select payment method error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to select payment method"
        });
    }
};

// ========================================
// SELLER MARKS ORDER AS HANDED OVER
// ========================================
const markOrderHandedOver = async (req, res) => {
    try {
        const order = await findOrder(req, res);

        if (!order) return;

        if (order.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the seller can mark the item as handed over"
            });
        }

        if (order.orderStatus !== "ReadyForPickup") {
            return res.status(400).json({
                success: false,
                message: "Order is not ready for handover"
            });
        }

        if (order.paymentMethod !== "CashOnPickup") {
            return res.status(400).json({
                success: false,
                message: "Cash on Pickup must be selected before handover"
            });
        }

        const [buyerExists, sellerExists, product] = await Promise.all([
            User.exists({ _id: order.buyer }),
            User.exists({ _id: order.seller }),
            Product.findById(order.product)
        ]);

        if (!buyerExists || !sellerExists || !product) {
            return res.status(400).json({
                success: false,
                message: "This order cannot proceed because a participant or product no longer exists."
            });
        }

        if (product.status === "Sold") {
            return res.status(400).json({
                success: false,
                message: "This product has already been sold"
            });
        }

        order.orderStatus = "HandedOver";
        order.handedOverAt = new Date();

        await order.save();

        await sendOrderNotification({
            req,
            recipient: order.buyer,
            sender: order.seller,
            title: "Item Handed Over",
            message: "The seller marked the item as handed over. Please confirm that you received it.",
            productId: order.product,
            orderId: order._id
        });

        return res.status(200).json({
            success: true,
            message: "Order marked as handed over",
            order
        });
    } catch (error) {
        console.error("Mark handover error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark order as handed over"
        });
    }
};

// ========================================
// BUYER CONFIRMS ORDER RECEIPT
// ========================================
const confirmOrderReceived = async (req, res) => {
    try {
        const order = await findOrder(req, res);

        if (!order) return;

        if (order.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the buyer can confirm receipt"
            });
        }

        if (order.orderStatus !== "HandedOver") {
            return res.status(400).json({
                success: false,
                message: "Order has not been marked as handed over yet"
            });
        }

        const [buyerExists, sellerExists, product] = await Promise.all([
            User.exists({ _id: order.buyer }),
            User.exists({ _id: order.seller }),
            Product.findById(order.product)
        ]);

        if (!buyerExists || !sellerExists || !product) {
            return res.status(400).json({
                success: false,
                message: "This order cannot be completed because a participant or product no longer exists."
            });
        }

        if (product.status === "Sold") {
            return res.status(400).json({
                success: false,
                message: "This product has already been sold"
            });
        }

        // Complete the order.
        order.orderStatus = "Completed";
        order.completedAt = new Date();

        if (order.paymentMethod === "CashOnPickup") {
            order.paymentStatus = "Paid";
            order.paidAt = new Date();
        }

        // Save the order and product status.
        product.status = "Sold";

        await Promise.all([
            order.save(),
            product.save()
        ]);

        await sendOrderNotification({
            req,
            recipient: order.seller,
            sender: order.buyer,
            title: "Order Completed",
            message: "The buyer confirmed receipt. The product is now marked as sold.",
            productId: order.product,
            orderId: order._id
        });

        return res.status(200).json({
            success: true,
            message: "Order completed successfully. Product marked as sold.",
            order
        });
    } catch (error) {
        console.error("Confirm order received error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to confirm order receipt"
        });
    }
};

module.exports = {
    getMyOrders,
    selectPaymentMethod,
    markOrderHandedOver,
    confirmOrderReceived
};