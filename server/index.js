import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// 1. Initialize 'io' correctly with CORS
const io = new Server(server, {
  cors: {
    origin: "https://dungeonmaze.vercel.app", // Your Vercel URL
    methods: ["GET", "POST"]
  }
});

const players = {}; 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!players[roomId]) players[roomId] = {};
    
    // Initialize player at start position
    players[roomId][socket.id] = { x: 162, y: 162, emoji: '🧙‍♂️' };

    // Update everyone in the room
    io.to(roomId).emit('update-players', players[roomId]);
  });

  socket.on('start-game', (roomId) => {
    io.to(roomId).emit('game-started');
  });

  socket.on('send-move', ({ roomId, direction }) => {
    // Check if the room and player exist
    if (!players[roomId] || !players[roomId][socket.id]) return;
    
    const player = players[roomId][socket.id];
    const step = 8; 

    // Update coordinates
    if (direction === 'North') player.y -= step;
    if (direction === 'South') player.y += step;
    if (direction === 'West') player.x -= step;
    if (direction === 'East') player.x += step;

    // BROADCAST: Send the updated map of ALL players in that specific room
    io.to(roomId).emit('update-players', players[roomId]);
});

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (players[roomId] && players[roomId][socket.id]) {
        delete players[roomId][socket.id];
        io.to(roomId).emit('update-players', players[roomId]);
      }
    }
  });
  
  // index.js (Server)
  socket.on('player-details', ({ roomId, name, classType, emoji }) => {
    if (players[roomId] && players[roomId][socket.id]) {
      // 1. Update the existing object with the new data from the phone
      players[roomId][socket.id].name = name;
      players[roomId][socket.id].classType = classType;
      players[roomId][socket.id].emoji = emoji;

      console.log(`Updated player ${socket.id} in room ${roomId}:`, players[roomId][socket.id]);

      // 2. Broadcast to everyone (Desktop Lobby & other phones)
      io.to(roomId).emit('update-players', players[roomId]);
    } else {
      console.log("Error: Player tried to send details but wasn't in the players object yet.");
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});