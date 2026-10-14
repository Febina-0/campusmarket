const Reservation = require("../models/Reservation");
const Notification = require("../models/Notification");



const notifyWishlistUsers = require(
    "../utils/notifyWishlistUsers"
);


// EXPIRE PENDING RESERVATIONS
const expireReservations = async (io) => {
    try {
        // Find all pending reservations
        // whose expiry time has passed
        const expiredReservations = await Reservation.find({
            status: "PendingSeller",
            expiresAt: {
                $lte: new Date()
            }
        }).populate("product");


        for (const reservation of expiredReservations) {

            // Mark reservation as expired
            reservation.status = "Expired";

            await reservation.save();


            // Check if product still exists
            if (reservation.product) {

                // Make product available again
                reservation.product.status = "Available";

                await reservation.product.save();


                // Notify wishlist users
                await notifyWishlistUsers(
                    reservation.product,
                    "is available again!",
                    io
                );


                
            }


            // Notify the buyer whose reservation expired
            const notification = await Notification.create({
                recipient: reservation.buyer,
                sender: reservation.seller,
                type: "product",
                title: "Reservation Expired",
                message:
                    "Your reservation expired because the seller did not respond in time.",
                relatedProduct: reservation.product
                    ? reservation.product._id
                    : null
            });


            // Send real-time notification
            if (io) {
                io.to(
                    reservation.buyer.toString()
                ).emit(
                    "new_notification",
                    notification
                );
            }


            console.log(
                `Reservation ${reservation._id} expired`
            );
        }


    } catch (error) {
        console.error(
            "Reservation expiry job failed:",
            error.message
        );
    }
};


module.exports = expireReservations;