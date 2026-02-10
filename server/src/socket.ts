import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            // SBP-005: Use strict origin allowlist instead of wildcard
            origin: process.env.ALLOWED_ORIGINS
                ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
                : ['http://localhost:5173', 'https://warranty.emporiobyautoform.in'],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware for Socket.io
    io.use((socket, next) => {
        // SBP-006: Read token from cookie first, then fall back to handshake auth
        const cookieHeader = socket.handshake.headers.cookie || '';
        const cookies = Object.fromEntries(
            cookieHeader.split(';').map(c => {
                const [key, ...val] = c.trim().split('=');
                return [key, val.join('=')];
            })
        );
        const token = cookies['auth_token'] || socket.handshake.auth?.token;

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
