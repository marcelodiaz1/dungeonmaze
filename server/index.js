import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
// In the Server index.js
const distanceToCenter = Math.sqrt(Math.pow(playerX - centerX, 2) + Math.pow(playerY - centerY, 2));

if (distanceToCenter < 50) {
  // Trigger "The Chamber of the Ancient"
  const boss = await axios.get('https://dnd5e.magical20.com/api/monsters/beholder');
  io.to(roomId).emit('dm-narration', `You enter the grand rotunda. A ${boss.data.name} descends from the shadows!`);
}
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your specific URL
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`👤 Player joined room: ${roomId}`);
  });

socket.on('send-move', async (data) => {
  const { direction, roomId } = data;
  io.to(roomId).emit('player-moved', direction);

  // 20% chance to find a monster in the new room
  const isEncounter = Math.random() < 0.2;
  let context = `The player moves ${direction} through the stone corridors.`;

  if (isEncounter) {
    const monster = await getRandomEncounter();
    if (monster) {
      context += ` They encounter a ${monster.name}! 
                   Its size is ${monster.size} and it has ${monster.hit_points} HP. 
                   Describe this terrifying appearance.`;
    }
  }

  // Send to OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a D&D Dungeon Master. Use provided monster data to narrate a dark, turn-based encounter." },
      { role: "user", content: context }
    ]
  });
// Inside your movement handler in App.jsx
const checkCollision = (newX, newY) => {
  // 1. Get the 2D context of our hidden maze canvas
  const ctx = canvasRef.current.getContext('2d');
  
  // 2. Sample the pixel at the intended move location
  // We check a small area around the player to ensure they don't "clip" through walls
  const pixel = ctx.getImageData(newX, newY, 1, 1).data;
  
  // 3. If the pixel is dark (R, G, B all low), it's a wall
  const isWall = pixel[0] < 50 && pixel[1] < 50 && pixel[2] < 50;
  
  return !isWall;
};

socketRef.current.on('player-moved', (direction) => {
  setPlayerPos(prev => {
    let nextPos = { ...prev };
    const step = 10; // Pixels per move

    if (direction === 'North') nextPos.y -= step;
    if (direction === 'South') nextPos.y += step;
    if (direction === 'West')  nextPos.x -= step;
    if (direction === 'East')  nextPos.x += step;

    if (checkCollision(nextPos.x, nextPos.y)) {
      return nextPos;
    }
    return prev; // Stay put if hitting a wall
  });
});
  io.to(roomId).emit('dm-narration', response.choices[0].message.content);
});

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Dungeon Server running on http://localhost:${PORT}`);
});

import axios from 'axios'; // You'll need to: npm install axios

async function getRandomEncounter() {
  try {
    // 1. Fetch the list of all monsters
    const response = await axios.get('https://dnd5e.magical20.com/api/monsters');
    const monsters = response.data.results;
    
    // 2. Pick a random one
    const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
    
    // 3. Fetch the specific details for that monster
    const details = await axios.get(`https://dnd5e.magical20.com${randomMonster.url}`);
    return details.data;
  } catch (error) {
    console.error("API Fetch Error:", error);
    return null;
  }
}