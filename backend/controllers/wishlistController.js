const User = require("../models/User");
const Product = require("../models/Product");


// ADD PRODUCT TO WISHLIST
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Prevent user from adding their own product
        if (
            product.seller.toString() ===
            req.user._id.toString()
        ) {
            return res.status(400).json({
                message: "You cannot add your own product to the wishlist"
            });
        }

        // Get logged-in user
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check if product is already in wishlist
        const alreadyExists = user.wishlist.some(
            (id) => id.toString() === productId
        );

        if (alreadyExists) {
            return res.status(400).json({
                message: "Product already in wishlist"
            });
        }

        // Add product to wishlist
        user.wishlist.push(productId);

        await user.save();

        res.status(200).json({
            message: "Product added to wishlist",
            wishlist: user.wishlist
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add product to wishlist",
            error: error.message
        });
    }
};


// GET MY WISHLIST
const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: "wishlist",
                populate: {
                    path: "seller",
                    select: "name email phone"
                }
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            count: user.wishlist.length,
            wishlist: user.wishlist
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch wishlist",
            error: error.message
        });
    }
};


// REMOVE PRODUCT FROM WISHLIST
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check whether product is actually in wishlist
        const exists = user.wishlist.some(
            (id) => id.toString() === productId
        );

        if (!exists) {
            return res.status(404).json({
                message: "Product is not in your wishlist"
            });
        }

        // Remove product from wishlist
        user.wishlist = user.wishlist.filter(
            (id) => id.toString() !== productId
        );

        await user.save();

        res.status(200).json({
            message: "Product removed from wishlist",
            wishlist: user.wishlist
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to remove product from wishlist",
            error: error.message
        });
    }
};


module.exports = {
    addToWishlist,
    getWishlist,
    removeFromWishlist
};