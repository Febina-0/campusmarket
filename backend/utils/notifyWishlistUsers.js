const User = require("../models/User");
const Notification = require("../models/Notification");

const notifyWishlistUsers = async (product, messageSuffix, io) => {
    try {
        // Find all users who have this product in their wishlist
        const users = await User.find({ wishlist: product._id });

        if (users.length === 0) return;

        for (const user of users) {
            // Create a notification
            const notification = await Notification.create({
                recipient: user._id,
                type: "wishlist",
                title: "Wishlist Update",
                message: `An item in your wishlist, ${product.title}, ${messageSuffix}`,
                relatedProduct: product._id
            });

            // Send real-time notification if Socket.IO is available
            if (io) {
                io.to(user._id.toString()).emit("new_notification", notification);
            }
        }

    } catch (error) {
        console.error("Error in notifyWishlistUsers:", error.message);
    }
};

module.exports = notifyWishlistUsers;
