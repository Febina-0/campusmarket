const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

const http = require("http");

require("dotenv").config();

const jwt = require("jsonwebtoken");

const mongoose = require("mongoose");

const app = require("./app");

const connectDB = require("./config/db");

const expireReservations =
    require("./jobs/reservationExpiry");

const Conversation =
    require("./models/Conversation");

const { Server } =
    require("socket.io");


// ========================================
// CONNECT TO DATABASE
// ========================================

connectDB();


// ========================================
// CREATE HTTP SERVER
// ========================================

const server =
    http.createServer(app);


// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {

    cors: {

        origin: "http://localhost:3000",

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE"
        ],

        credentials: true

    }

});


// ========================================
// SOCKET AUTHENTICATION
// ========================================

io.use((socket, next) => {

    try {

        const token =
            socket.handshake.auth?.token;

        if (!token) {

            return next(
                new Error(
                    "Authentication token required"
                )
            );

        }


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        socket.userId =
            decoded.id ||
            decoded._id ||
            decoded.userId;


        if (!socket.userId) {

            return next(
                new Error(
                    "Invalid authentication token"
                )
            );

        }


        next();

    } catch (error) {

        console.error(
            "Socket authentication failed:",
            error.message
        );

        next(
            new Error(
                "Socket authentication failed"
            )
        );

    }

});


// ========================================
// SOCKET CONNECTION
// ========================================

io.on(
    "connection",
    (socket) => {

        console.log(
            `Socket connected: ${socket.id}`
        );


        // =================================
        // PERSONAL USER ROOM
        // =================================

        socket.join(
            socket.userId.toString()
        );


        console.log(
            `User ${socket.userId} joined personal room`
        );


        // =================================
        // JOIN CONVERSATION
        // =================================

        socket.on(
            "join_conversation",
            async (conversationId) => {

                try {

                    if (
                        !mongoose.Types.ObjectId.isValid(
                            conversationId
                        )
                    ) {

                        return;

                    }


                    const conversation =
                        await Conversation.findOne({
                            _id: conversationId,

                            participants:
                                socket.userId
                        });


                    if (!conversation) {

                        console.log(
                            `Unauthorized conversation access attempt by ${socket.userId}`
                        );

                        return;

                    }


                    socket.join(
                        conversationId.toString()
                    );


                    console.log(
                        `User ${socket.userId} joined conversation ${conversationId}`
                    );

                } catch (error) {

                    console.error(
                        "Join conversation error:",
                        error.message
                    );

                }

            }
        );


        // =================================
        // LEAVE CONVERSATION
        // =================================

        socket.on(
            "leave_conversation",
            (conversationId) => {

                if (conversationId) {

                    socket.leave(
                        conversationId.toString()
                    );


                    console.log(
                        `User ${socket.userId} left conversation ${conversationId}`
                    );

                }

            }
        );


        // =================================
        // DISCONNECT
        // =================================

        socket.on(
            "disconnect",
            () => {

                console.log(
                    `Socket disconnected: ${socket.id}`
                );

            }
        );

    }
);


// ========================================
// RESERVATION EXPIRY
// ========================================

const EXPIRY_INTERVAL_MS =
    5 * 60 * 1000;


setInterval(
    () => {

        expireReservations(io);

    },
    EXPIRY_INTERVAL_MS
);


expireReservations(io);


// ========================================
// START SERVER
// ========================================

const PORT =
    process.env.PORT || 5001;


server.listen(
    PORT,
    () => {

        console.log(
            `Server is running on port ${PORT}`
        );

    }
);