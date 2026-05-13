let roomPlayers = {}; // { roomId: { socketId: { x, y } } }


const players = {}; // Structure: { [roomId]: { [socketId]: { x, y, emoji } } }

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    if (!players[roomId]) players[roomId] = {};
    
    // Add the new player
    players[roomId][socket.id] = { 
      x: 162, 
      y: 162, 
      emoji: '🧙‍♂️' 
    };

    // CRITICAL: Use io.to().emit to update EVERYONE in the room
    io.to(roomId).emit('update-players', players[roomId]);
  });

  socket.on('disconnecting', () => {
    // Clean up when someone leaves
    for (const roomId of socket.rooms) {
      if (players[roomId]) {
        delete players[roomId][socket.id];
        io.to(roomId).emit('update-players', players[roomId]);
      }
    }
  });


socket.on('start-game', (roomId) => {
  // Tells everyone in the room to change their 'view' state to 'desktop'
  io.to(roomId).emit('game-started');
});
  socket.on('send-move', ({ roomId, direction }) => {
    const player = roomPlayers[roomId][socket.id];
    if (!player) return;

    const step = 8;
    if (direction === 'North') player.y -= step;
    if (direction === 'South') player.y += step;
    if (direction === 'West') player.x -= step;
    if (direction === 'East') player.x += step;

    // Broadcast the specific move to everyone
    io.to(roomId).emit('player-moved', { id: socket.id, pos: player });
  });

  socket.on('disconnect', () => {
    // Clean up player from rooms on disconnect
    // (Add logic to find which room they were in and delete them)
  });
});