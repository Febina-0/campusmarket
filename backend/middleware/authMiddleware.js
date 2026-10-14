
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ========================================
// VERIFY USER AUTHENTICATION
// ========================================
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Not authorized. Please log in."
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication token is missing."
        });
    }

    try {
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                success: false,
                message: "Authentication configuration error."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        const user = await User.findById(decoded.id)
            .select("-password");

        // A physically deleted account will not be found.
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. This account may have been deleted."
            });
        }

        // Also block legacy accounts marked as deleted.
        if (user.isDeleted === true) {
            return res.status(401).json({
                success: false,
                message: "This account is no longer active."
            });
        }

        req.user = user;

        return next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Your session has expired. Please log in again."
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        console.error("AUTHENTICATION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication failed."
        });
    }
};

// ========================================
// ALLOW ADMINISTRATORS ONLY
// ========================================
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required."
        });
    }

    return next();
};

module.exports = {
    protect,
    adminOnly
};