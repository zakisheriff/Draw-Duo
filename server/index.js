const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

// Store room data: roomId -> { strokes: [] }
const rooms = {};

const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);

        // Initialize room if not exists
        if (!rooms[roomId]) {
            rooms[roomId] = { strokes: [] };
        }

        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        console.log(`User ${socket.id} joined room ${roomId}. Total users: ${roomSize}`);

        // Send existing history to the new joiner
        console.log(`Sending history to ${socket.id} in room ${roomId}: ${rooms[roomId].strokes.length} strokes`);
        socket.emit('load-canvas', rooms[roomId].strokes);

        // Notify others in room
        socket.to(roomId).emit('user-joined', { userId: socket.id });
    });

    // Explicit request for canvas state
    socket.on('get-canvas', (roomId) => {
        if (rooms[roomId]) {
            console.log(`Sending requested history to ${socket.id} for room ${roomId}`);
            socket.emit('load-canvas', rooms[roomId].strokes);
        }
    });

    // Client sends a full path or segment
    socket.on('draw-stroke', ({ roomId, path, color, strokeWidth }) => {
        const strokeData = { path, color, strokeWidth, userId: socket.id };

        // Save to history
        if (rooms[roomId]) {
            rooms[roomId].strokes.push(strokeData);
        }

        // Broadcast to everyone else in the room
        socket.to(roomId).emit('draw-stroke', strokeData);
    });

    // Handle live drawing moves
    socket.on('drawing-move', ({ roomId, path, color, strokeWidth }) => {
        socket.to(roomId).emit('drawing-move', { path, color, strokeWidth, userId: socket.id });
    });

    // Broadcast undo
    socket.on('undo-stroke', ({ roomId }) => {
        if (rooms[roomId] && rooms[roomId].strokes.length > 0) {
            rooms[roomId].strokes.pop(); // Remove last stroke
        }
        socket.to(roomId).emit('undo-stroke');
    });

    // Clear canvas event
    socket.on('clear-canvas', (roomId) => {
        if (rooms[roomId]) {
            rooms[roomId].strokes = [];
        }
        io.to(roomId).emit('clear-canvas');
    });

    // Chat messages
    socket.on('send-message', ({ roomId, message, userId, timestamp }) => {
        socket.to(roomId).emit('receive-message', { message, userId, timestamp });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Could notify room about disconnection if needed
    });
});

server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
