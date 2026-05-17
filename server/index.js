import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey:  process.env.GROQ_API_KEY,  
  baseURL: "https://api.groq.com/openai/v1", // This points it away from the paid site
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a D&D DM." },
               { role: "user", content: "I enter the labyrinth." }],
    model: "llama3-8b-8192", // A high-performance free model
  });
  console.log(chatCompletion.choices[0].message.content);
}
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
const startListening = () => {
  // Check if browser supports speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    alert("Your browser does not support voice commands.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false; // Stops after one sentence

  recognition.onstart = () => console.log("DM is listening...");
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("You said:", transcript);
    
    // Send it to your server via Socket.io
    socket.emit('player-chat', { roomId, message: transcript });
  };

  recognition.start();
};
// In server.js inside your socket.on('player-chat')
const chatCompletion = await groq.chat.completions.create({
  messages: [
    { 
      role: "system", 
      content: `You are a D&D DM. A player is speaking to you via voice. 
                Keep your responses cinematic but SHORT (2-3 sentences max) 
                so the flow of the game stays fast.` 
    },
    { role: "user", content: message }
  ],
  model: "llama3-8b-8192",
});
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('dm-message', (data) => {
    // 1. Show it in the UI
    setGameLog(prev => [...prev, data]);

    // 2. Say it out loud
    const utterance = new SpeechSynthesisUtterance(data.text);
    utterance.pitch = 0.8; // Lower pitch for a "DM" voice
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  });
 
  // In server.js
socket.on('player-chat', async ({ roomId, message }) => {
  const player = players[roomId]?.[socket.id];
  
  const systemPrompt = `
    You are the Dungeon Master of a cursed, shifting Labyrinth. 
    CURRENT QUEST: "The Heart of the Minotaur." 
    OBJECTIVE: Players must find the Obsidian Altar at the center to break the curse.
    
    RULES:
    1. Be descriptive but keep responses under 60 words.
    2. Use the player's name (${player?.name}) and class (${player?.classType}).
    3. If they describe an action, tell them what they see or hear next.
    4. Occasionally mention the narrow stone walls and the flickering torchlight.
    5. Do not finish the quest for them; lead them to the next choice.
  `;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ],
    model: "llama3-8b-8192",
  });

  const dmText = chatCompletion.choices[0].message.content;
  io.to(roomId).emit('dm-message', { sender: "DM", text: dmText });
});
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
      if (players[roomId]) {
            socket.emit('update-players', players[roomId]);
          }
  });

socket.on('start-game', async (roomId) => {
  // 1. Ask AI to generate a quest title and hook
  const questGen = await groq.chat.completions.create({
    messages: [{ role: "user", content: "Generate a 1-sentence D&D quest hook for a dark maze." }],
    model: "llama3-8b-8192",
  });

  const questHook = questGen.choices[0].message.content;

  // 2. Broadcast the "Quest Started" message to all players
  io.to(roomId).emit('dm-message', { 
    sender: "SYSTEM", 
    text: `📜 QUEST STARTED: ${questHook}` 
  });

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
    if (!players[roomId]) players[roomId] = {};

    // Now we officially create the player entry
    players[roomId][socket.id] = {
      x: 162,
      y: 162,
      name: name,
      classType: classType,
      emoji: emoji,
      hp: 10,
      maxHp: 10
    };

    io.to(roomId).emit('update-players', players[roomId]);
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