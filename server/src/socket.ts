import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust this in production
            methods: ["GET", "POST"]
        }
    });

    // Authentication middleware for Socket.io
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            socket.data.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.data.user?.id;
        const role = socket.data.user?.role;

        if (userId) {
            console.log(`📡 User ${userId} (${role}) connected to socket`);

            // Join universal user-specific room
            socket.join(`user_${userId}`);

            // Join role-specific rooms for efficient broadcasting
            if (role) {
                socket.join(`role_${role}`);
                console.log(`📡 User ${userId} joined room: role_${role}`);
            }
        }

        socket.on('disconnect', () => {
            console.log(`🔌 User ${userId} disconnected from socket`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
