const express = require("express");
const router = express.Router();
const {
    createReservation,
    acceptReservation,
    rejectReservation,
    cancelReservation,
    getMyReservations,
    getIncomingReservations
} = require("../controllers/reservationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/my", getMyReservations);
router.get("/incoming", getIncomingReservations);
router.post("/:productId", createReservation);
router.patch("/:id/accept", acceptReservation);
router.put("/:id/accept", acceptReservation);
router.patch("/:id/reject", rejectReservation);
router.put("/:id/reject", rejectReservation);
router.patch("/:id/cancel", cancelReservation);
router.put("/:id/cancel", cancelReservation);

module.exports = router;
