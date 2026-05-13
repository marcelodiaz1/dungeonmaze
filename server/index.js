const players = {}; 

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!players[roomId]) players[roomId] = {};
    
    // Initialize player
    players[roomId][socket.id] = { x: 162, y: 162, emoji: '🧙‍♂️' };

    // Update everyone
    io.to(roomId).emit('update-players', players[roomId]);
  });

  socket.on('start-game', (roomId) => {
    io.to(roomId).emit('game-started');
  });

  socket.on('send-move', ({ roomId, direction }) => {
    // FIX: Use 'players' instead of 'roomPlayers'
    if (!players[roomId] || !players[roomId][socket.id]) return;
    
    const player = players[roomId][socket.id];
    const step = 8;
    if (direction === 'North') player.y -= step;
    if (direction === 'South') player.y += step;
    if (direction === 'West') player.x -= step;
    if (direction === 'East') player.x += step;

    io.to(roomId).emit('player-moved', { id: socket.id, pos: player });
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (players[roomId] && players[roomId][socket.id]) {
        delete players[roomId][socket.id];
        io.to(roomId).emit('update-players', players[roomId]);
      }
    }
  });
});