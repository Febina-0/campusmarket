const express = require("express");

const router = express.Router();

const {
    getMyOrders,
    selectPaymentMethod,
    markOrderHandedOver,
    confirmOrderReceived
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");


// All order routes require login
router.use(protect);


// Get buyer/seller orders
router.get(
    "/my-orders",
    getMyOrders
);


// Select Cash on Pickup
router.patch(
    "/:orderId/payment-method",
    selectPaymentMethod
);


// Seller marks item as handed over
router.patch(
    "/:orderId/hand-over",
    markOrderHandedOver
);


// Buyer confirms item received
router.patch(
    "/:orderId/confirm-received",
    confirmOrderReceived
);


module.exports = router;