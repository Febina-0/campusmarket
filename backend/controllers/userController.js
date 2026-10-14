
const mongoose = require("mongoose");
const User = require("../models/User");

// ========================================
// GET USER PROFILE
// ========================================
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found. This account may have been deleted."
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("GET USER PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch user profile"
        });
    }
};

// ========================================
// UPDATE USER PROFILE
// ========================================
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found. This account may have been deleted."
            });
        }

        // Only students should update their student profile.
        if (user.role !== "user") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this profile"
            });
        }

        const { name, phone } = req.body;

        if (name !== undefined) {
            if (
                typeof name !== "string" ||
                !name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }

            user.name = name.trim();
        }

        if (phone !== undefined) {
            if (typeof phone !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Phone must be a string"
                });
            }

            user.phone = phone.trim();
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error("UPDATE USER PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
};

// ========================================
// GET USER BY ID (PUBLIC INFORMATION)
// ========================================
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const user = await User.findOne({
            _id: id,
            role: "user"
        }).select("name email phone createdAt");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("GET USER BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch user"
        });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserById
};