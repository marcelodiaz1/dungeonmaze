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
  console.log('User connected:', socket.id);

  // --- ROOM MANAGEMENT ---
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (players[roomId]) {
      socket.emit('update-players', players[roomId]);
    }
  });

  socket.on('player-details', ({ roomId, name, classType, emoji }) => {
    if (!players[roomId]) players[roomId] = {};

    // Create or update the persistent reference safely
    players[roomId][socket.id] = {
      x: 162,
      y: 162,
      name: name,
      classType: classType,
      emoji: emoji,
      hp: 10,
      maxHp: 10
    };

    console.log(`Updated player ${socket.id} in room ${roomId}:`, players[roomId][socket.id]);
    io.to(roomId).emit('update-players', players[roomId]);
  });

  socket.on('start-game', async (roomId) => {
    try {
      // 1. Ask AI to generate a dynamic quest hook
      const questGen = await groq.chat.completions.create({
        messages: [{ role: "user", content: "Generate a 1-sentence D&D quest hook for a dark maze." }],
        model: "llama3-8b-8192",
      });

      const questHook = questGen.choices[0].message.content;

      // 2. Broadcast the text layout out to room frontends
      io.to(roomId).emit('dm-message', { 
        sender: "SYSTEM", 
        text: `📜 QUEST STARTED: ${questHook}` 
      });

      io.to(roomId).emit('game-started');
    } catch (err) {
      console.error("Error generating quest hook:", err.message);
      io.to(roomId).emit('game-started');
    }
  });

  // --- THE AI LOOP: Handle Transcribed Player Speech ---
 socket.on('player-chat', async ({ roomId, message }) => {
    console.log(`🔌 [Incoming Chat] Room: ${roomId} | Message: "${message}"`);

    // 1. SAFETY GUARD: If the room doesn't exist in memory yet, initialize it
    if (!players[roomId]) {
      players[roomId] = {};
    }

    // 2. SAFETY GUARD: Grab player details, or fall back to default safely
    const player = players[roomId][socket.id] || {
      name: "An unknown hero",
      classType: "Adventurer"
    };

    console.log(`🎭 Processing turn for: ${player.name} (${player.classType})`);

    const systemPrompt = `
      You are the Dungeon Master of a cursed, shifting Labyrinth. 
      CURRENT QUEST: "The Heart of the Minotaur." 
      OBJECTIVE: Players must find the Obsidian Altar at the center to break the curse.
      
      RULES:
      1. Be descriptive but keep responses under 60 words.
      2. Use the player's name (${player.name}) and class (${player.classType}).
      3. If they describe an action, tell them what they see or hear next.
      4. Occasionally mention the narrow stone walls and the flickering torchlight.
      5. Do not finish the quest for them; lead them to the next choice.
    `;

    try {
      console.log("🧠 Sending request to Groq API...");
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        model: "llama3-8b-8192",
      });

      const dmText = chatCompletion.choices[0].message.content;
      console.log("✨ Groq responded successfully:", dmText);

      // Broadcast out to ALL clients in the room (including the desktop view)
      io.to(roomId).emit('dm-message', { sender: "DM", text: dmText });

    } catch (error) {
      // This will tell you exactly why Groq isn't being called (e.g., bad key, authentication error)
      console.error("❌ CRITICAL GROQ API ERROR:", error.message);
      
      io.to(roomId).emit('dm-message', { 
        sender: "DM", 
        text: "The stone walls crumble slightly, breaking my focus..." 
      });
    }
  });
  // --- ENGINE: Isomorphic Map Translation ---
  socket.on('send-move', ({ roomId, direction }) => {
    if (!players[roomId] || !players[roomId][socket.id]) return;
    
    const player = players[roomId][socket.id];
    const step = 8; 

    if (direction === 'North') player.y -= step;
    if (direction === 'South') player.y += step;
    if (direction === 'West')  player.x -= step;
    if (direction === 'East')  player.x += step;

    io.to(roomId).emit('update-players', players[roomId]);
  });

  // --- LIFE CYCLE: Disconnect Cleanup ---
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (players[roomId] && players[roomId][socket.id]) {
        delete players[roomId][socket.id];
        io.to(roomId).emit('update-players', players[roomId]);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected cleanly:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`D&D Live Engine running on port ${PORT}`);
});