import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import OpenAI from "openai";
import 'dotenv/config'; 

// 1. Initialize Groq via OpenAI SDK Client compatibility
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,  
  baseURL: "https://api.groq.com/openai/v1", 
});

const app = express();
const server = createServer(app);

// 2. Initialize Socket.io with strict CORS configuration
const io = new Server(server, {
  cors: {
    origin: "https://dungeonmaze.vercel.app", 
    methods: ["GET", "POST"]
  }
});

// Structural room state: { [roomId]: { [socketId]: playerObject } }
const players = {}; 

io.on('connection', (socket) => {
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    // Ensure room context is instantiated immediately
    if (!players[roomId]) {
      players[roomId] = { activePlayers: {} };
    }
    
    // Send current structural party back to whoever just connected
    socket.emit('update-players', players[roomId].activePlayers);
  });

  socket.on('player-details', ({ roomId, name, classType, emoji }) => {
    if (!players[roomId]) players[roomId] = { activePlayers: {} };

    // Bind data to the active network socket connection
    players[roomId].activePlayers[socket.id] = {
      x: 162,
      y: 162,
      name: name,
      classType: classType,
      emoji: emoji,
      hp: 10,
      maxHp: 10
    };

    console.log(`⚔️ Hero Manifested [${name}] in Room [${roomId}]`);
    io.to(roomId).emit('update-players', players[roomId].activePlayers);
  });

  socket.on('player-chat', async ({ roomId, message }) => {
    console.log(`🔌 Voice Payload Received from Room: ${roomId}`);

    if (!players[roomId]) players[roomId] = { activePlayers: {} };

    // Fallback search: Find player profile context safely
    const player = players[roomId].activePlayers[socket.id] || {
      name: "A Mysterious Seeker",
      classType: "Rogue"
    };

    const systemPrompt = `
      You are the Dungeon Master of a cursed Labyrinth.
      Respond in under 50 words. Be atmospheric.
      Current Hero acting: ${player.name} the ${player.classType}.
    `;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        model: "llama3-8b-8192",
      });

      const dmText = chatCompletion.choices[0].message.content;
      
      // Force direct broadcast to all channels linked to this room signature
      io.to(roomId).emit('dm-message', { sender: "DM", text: dmText });

    } catch (error) {
      console.error("Groq Processing Failure:", error.message);
      io.to(roomId).emit('dm-message', { 
        sender: "DM", 
        text: `⚠️ Engine Error: ${error.message}` 
      });
    }
  });
  
  // Update your disconnect loops to check the nested structure safely
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (players[roomId] && players[roomId].activePlayers?.[socket.id]) {
        delete players[roomId].activePlayers[socket.id];
        io.to(roomId).emit('update-players', players[roomId].activePlayers);
      }
    }
  });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`D&D Live Engine running on port ${PORT}`);
});