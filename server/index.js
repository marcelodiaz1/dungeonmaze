let roomPlayers = {}; // { roomId: { socketId: { x, y } } }

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    // Initialize player if they don't exist
    if (!roomPlayers[roomId]) roomPlayers[roomId] = {};
    roomPlayers[roomId][socket.id] = { x: 162, y: 162 };

    // Tell everyone in the room about the new player list
    io.to(roomId).emit('update-players', roomPlayers[roomId]);
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