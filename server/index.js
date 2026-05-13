import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    // Tip: Use "*" during testing if you still have issues, 
    // then switch back to your Vercel URL for production.
    origin: ["https://dungeonmaze.vercel.app", "http://localhost:3000"], 
    methods: ["GET", "POST"]
  }
});

// Structure: { "room-id": { "socket-id": { x, y, name, ... } } }
const players = {}; 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. JOIN ROOM (Spectator mode)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
    
    // Send existing players to the newcomer (so laptop sees current party)
    if (players[roomId]) {
      socket.emit('update-players', players[roomId]);
    }
  });

  // 2. REGISTER PLAYER (Triggered by Phone after character creation)
  socket.on('player-details', ({ roomId, name, classType, emoji }) => {
    if (!players[roomId]) players[roomId] = {};

    // Create or Update the player entry
    players[roomId][socket.id] = {
      x: 162,
      y: 162,
      name: name,
      classType: classType,
      emoji: emoji,
      hp: 10,
      maxHp: 10
    };

    console.log(`Hero Manifested: ${name} (${classType}) in ${roomId}`);

    // Broadcast the updated list to the whole room
    io.to(roomId).emit('update-players', players[roomId]);
  });

  // 3. START GAME
  socket.on('start-game', (roomId) => {
    io.to(roomId).emit('game-started');
  });

  // 4. MOVEMENT
  socket.on('send-move', ({ roomId, direction }) => {
    if (!players[roomId] || !players[roomId][socket.id]) return;
    
    const player = players[roomId][socket.id];
    const step = 18; // Increased slightly for better visibility

    if (direction === 'North') player.y -= step;
    if (direction === 'South') player.y += step;
    if (direction === 'West')  player.x -= step;
    if (direction === 'East')  player.x += step;

    io.to(roomId).emit('update-players', players[roomId]);
  });

  // 5. DISCONNECT
  socket.on('disconnecting', () => {
    // socket.rooms is a Set, so we use forEach
    socket.rooms.forEach(roomId => {
      if (players[roomId] && players[roomId][socket.id]) {
        console.log(`Removing ${players[roomId][socket.id].name} from room ${roomId}`);
        delete players[roomId][socket.id];
        
        // Update remaining players so the card disappears from the lobby
        io.to(roomId).emit('update-players', players[roomId]);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Dungeon Server online on port ${PORT}`);
});