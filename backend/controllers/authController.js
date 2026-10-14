
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const EmailVerification = require("../models/EmailVerification");
const transporter = require("../config/email");
const validateCollegeEmail = require("../utils/collegeEmailValidator");

// ========================================
// REGISTER USER
// ========================================
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        const validation = validateCollegeEmail(email);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const normalizedEmail = validation.email;

        const verification = await EmailVerification.findOne({
            email: normalizedEmail
        });

        if (!verification || !verification.verified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your college email before registration"
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: typeof phone === "string" ? phone.trim() : "",
            role: "user"
        });

        await EmailVerification.deleteOne({
            email: normalizedEmail
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};

// ========================================
// LOGIN USER AND ADMIN
// ========================================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from environment variables.");

            return res.status(500).json({
                success: false,
                message: "Authentication configuration error"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // IMPORTANT:
        // The User model uses select: false for password.
        // Explicitly retrieve it for password comparison.
        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user || user.isDeleted === true) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.password) {
            console.error(
                "Password hash is missing for account:",
                normalizedEmail
            );

            return res.status(500).json({
                success: false,
                message: "Unable to verify this account's password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString()
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            redirectTo:
                user.role === "admin"
                    ? "/admin/dashboard"
                    : "/"
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

// ========================================
// SEND COLLEGE EMAIL OTP
// ========================================
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "College email is required"
            });
        }

        const validation = validateCollegeEmail(email);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const normalizedEmail = validation.email;

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await EmailVerification.findOneAndUpdate(
            { email: normalizedEmail },
            {
                email: normalizedEmail,
                otp,
                expiresAt,
                verified: false
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: normalizedEmail,
            subject: "Campus Marketplace Email Verification",
            text:
                `Your Campus Marketplace verification code is ${otp}. ` +
                "This code expires in 10 minutes."
        });

        return res.status(200).json({
            success: true,
            message: "Verification OTP sent to your college email"
        });
    } catch (error) {
        console.error("Send OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });
    }
};

// ========================================
// VERIFY COLLEGE EMAIL OTP
// ========================================
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (
            typeof email !== "string" ||
            !email.trim() ||
            otp === undefined ||
            otp === null ||
            !String(otp).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const verification = await EmailVerification.findOne({
            email: normalizedEmail
        });

        if (!verification) {
            return res.status(400).json({
                success: false,
                message: "No OTP verification request found"
            });
        }

        if (verification.expiresAt < new Date()) {
            await EmailVerification.deleteOne({
                email: normalizedEmail
            });

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP."
            });
        }

        if (verification.otp !== String(otp).trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        verification.verified = true;
        await verification.save();

        return res.status(200).json({
            success: true,
            message: "College email verified successfully"
        });
    } catch (error) {
        console.error("Verify OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
};

// ========================================
// EXPORT FUNCTIONS
// ========================================
module.exports = {
    registerUser,
    loginUser,
    sendOTP,
    verifyOTP
};