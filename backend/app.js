const express = require("express");
const cors = require("cors");

console.log("LOADING CAMPUS MARKETPLACE APP.JS");

// ==============================
// IMPORT ROUTES
// ==============================

const authRoutes = require("./routes/authRoutes");

const userRoutes = require("./routes/userRoutes");

const productRoutes = require("./routes/productRoutes");

const wishlistRoutes = require("./routes/wishlistRoutes");

const conversationRoutes = require("./routes/conversationRoutes");

const messageRoutes = require("./routes/messageRoutes");

const notificationRoutes = require(
    "./routes/notificationRoutes"
);

const reservationRoutes = require(
    "./routes/reservationRoutes"
);



const orderRoutes = require(
    "./routes/orderRoutes"
);

const adminRoutes = require("./routes/adminRoutes");

// ==============================
// CREATE EXPRESS APP
// ==============================

const app = express();


// ==============================
// MIDDLEWARE
// ==============================

// Allow requests from React frontend
app.use(
    cors({
        origin: "http://localhost:3000",
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE"
        ],
        credentials: true
    })
);

// Parse JSON request bodies
app.use(
    express.json({
        limit: "10mb"
    })
);


// ==============================
// TEST ROUTES
// ==============================

// Root route
app.get("/", (req, res) => {
    res.send(
        "Campus Marketplace API is running!"
    );
});


// Health check route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running"
    });
});


// ==============================
// API ROUTES
// ==============================

// Authentication
app.use(
    "/api/auth",
    authRoutes
);


// Users
app.use(
    "/api/users",
    userRoutes
);


// Products
app.use(
    "/api/products",
    productRoutes
);


// Wishlist
app.use(
    "/api/wishlist",
    wishlistRoutes
);


// Conversations
app.use(
    "/api/conversations",
    conversationRoutes
);


// Messages
app.use(
    "/api/messages",
    messageRoutes
);


// Notifications
app.use(
    "/api/notifications",
    notificationRoutes
);


// Reservations
app.use(
    "/api/reservations",
    reservationRoutes
);

app.use("/api/admin", adminRoutes);



// Orders
app.use(
    "/api/orders",
    orderRoutes
);


// ==============================
// 404 ROUTE HANDLER
// ==============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});


// ==============================
// EXPORT APP
// ==============================

module.exports = app;