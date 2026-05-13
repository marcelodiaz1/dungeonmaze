import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const SERVER_URL = "http://10.0.10.231:3001"; 
const ROOM_ID = "dnd-maze-1";

function App() {
  // Views: 'lobby', 'desktop', 'mobile'
  const [view, setView] = useState('lobby');
  const [playerPos, setPlayerPos] = useState({ x: 162, y: 162 });
  const [messages, setMessages] = useState(["The circular walls pulse with magic..."]);
  const socketRef = useRef();

  // Detect if user is on mobile/join path immediately
  useEffect(() => {
    if (window.location.pathname.includes('/join')) {
      setView('mobile');
    }
  }, []);

  const joinGame = () => {
    socketRef.current = io(SERVER_URL);
    socketRef.current.emit('join-room', ROOM_ID);

    socketRef.current.on('player-moved', (direction) => {
      setPlayerPos(prev => {
        let { x, y } = prev;
        const step = 8;
        if (direction === 'North') y -= step;
        if (direction === 'South') y += step;
        if (direction === 'West') x -= step;
        if (direction === 'East') x += step;
        
        return (x > 0 && x < 324 && y > 0 && y < 324) ? { x, y } : prev;
      });
    });

    socketRef.current.on('dm-narration', (msg) => {
      setMessages(prev => [msg, ...prev].slice(0, 5));
    });

    // If we were in lobby and clicked join, move to desktop (if not mobile)
    if (view === 'lobby') setView('desktop');
  };

  const sendMove = (dir) => socketRef.current?.emit('send-move', { roomId: ROOM_ID, direction: dir });

  // --- RENDERING LOGIC ---

  // 1. LOBBY VIEW
  if (view === 'lobby') {
    return (
      <div className="lobby-screen">
        <div className="lobby-card">
          <h1>Dungeon Lobby</h1>
          <div className="character-preview">
            <span className="emoji">🧙‍♂️</span>
          </div>
          <p>The maze awaits your command, Traveler.</p>
          <button className="action-btn" onClick={joinGame}>Enter the Dungeon</button>
        </div>
      </div>
    );
  }

  // 2. MOBILE CONTROLLER VIEW
  if (view === 'mobile') {
    // Connect socket automatically for mobile if not connected
    if (!socketRef.current) joinGame(); 

    return (
      <div className="mobile-controller">
        <div className="d-pad">
          <button className="dir-btn up" onClick={() => sendMove('North')}>▲</button>
          <button className="dir-btn left" onClick={() => sendMove('West')}>◀</button>
          <button className="dir-btn right" onClick={() => sendMove('East')}>▶</button>
          <button className="dir-btn down" onClick={() => sendMove('South')}>▼</button>
        </div>
      </div>
    );
  }

  // 3. DESKTOP BOARD VIEW
  return (
    <div className="desktop-board">
      <div className="game-screen">
        <div className="isometric-wrapper">
          <div className="maze-container">
            <svg viewBox="0 0 324 324" className="maze-svg-walls">
              <g className="floor-layer"><MazeGeometry /></g>
              <g className="wall-top-layer"><MazeGeometry /></g>
            </svg>
            <div className="player-avatar" style={{ left: `${playerPos.x}px`, top: `${playerPos.y}px` }}>
              <span className="emoji">🧙‍♂️</span>
            </div>
          </div>
        </div>
      </div>
      <aside className="dm-log">
        <h3>Dungeon Master</h3>
        <div className="messages">
          {messages.map((m, i) => <p key={i} className="msg">{m}</p>)}
        </div>
      </aside>
    </div>
  );
}

// Keep your MazeGeometry component exactly as it was
const MazeGeometry = () => (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
       <line x1="2" y1="2" x2="146" y2="2" />
    <line x1="162" y1="2" x2="322" y2="2" />
    <line x1="34" y1="18" x2="50" y2="18" />
    <line x1="66" y1="18" x2="82" y2="18" />
    <line x1="210" y1="18" x2="226" y2="18" />
    <line x1="242" y1="18" x2="258" y2="18" />
    <line x1="274" y1="18" x2="306" y2="18" />
    <line x1="18" y1="34" x2="82" y2="34" />
    <line x1="98" y1="34" x2="146" y2="34" />
    <line x1="162" y1="34" x2="274" y2="34" />
    <line x1="306" y1="34" x2="322" y2="34" />
    <line x1="50" y1="50" x2="66" y2="50" />
    <line x1="82" y1="50" x2="98" y2="50" />
    <line x1="178" y1="50" x2="226" y2="50" />
    <line x1="242" y1="50" x2="258" y2="50" />
    <line x1="18" y1="66" x2="34" y2="66" />
    <line x1="50" y1="66" x2="66" y2="66" />
    <line x1="98" y1="66" x2="162" y2="66" />
    <line x1="226" y1="66" x2="242" y2="66" />
    <line x1="2" y1="82" x2="18" y2="82" />
    <line x1="34" y1="82" x2="50" y2="82" />
    <line x1="66" y1="82" x2="146" y2="82" />
    <line x1="162" y1="82" x2="194" y2="82" />
    <line x1="242" y1="82" x2="274" y2="82" />
    <line x1="290" y1="82" x2="306" y2="82" />
    <line x1="18" y1="98" x2="50" y2="98" />
    <line x1="114" y1="98" x2="162" y2="98" />
    <line x1="178" y1="98" x2="242" y2="98" />
    <line x1="290" y1="98" x2="322" y2="98" />
    <line x1="18" y1="114" x2="50" y2="114" />
    <line x1="82" y1="114" x2="98" y2="114" />
    <line x1="130" y1="114" x2="146" y2="114" />
    <line x1="162" y1="114" x2="210" y2="114" />
    <line x1="274" y1="114" x2="290" y2="114" />
    <line x1="2" y1="130" x2="18" y2="130" />
    <line x1="34" y1="130" x2="82" y2="130" />
    <line x1="114" y1="130" x2="178" y2="130" />
    <line x1="210" y1="130" x2="226" y2="130" />
    <line x1="290" y1="130" x2="306" y2="130" />
    <line x1="2" y1="146" x2="34" y2="146" />
    <line x1="82" y1="146" x2="98" y2="146" />
    <line x1="178" y1="146" x2="194" y2="146" />
    <line x1="210" y1="146" x2="242" y2="146" />
    <line x1="306" y1="146" x2="322" y2="146" />
    <line x1="50" y1="162" x2="114" y2="162" />
    <line x1="146" y1="162" x2="178" y2="162" />
    <line x1="194" y1="162" x2="210" y2="162" />
    <line x1="258" y1="162" x2="290" y2="162" />
    <line x1="2" y1="178" x2="18" y2="178" />
    <line x1="82" y1="178" x2="130" y2="178" />
    <line x1="178" y1="178" x2="226" y2="178" />
    <line x1="242" y1="178" x2="274" y2="178" />
    <line x1="290" y1="178" x2="306" y2="178" />
    <line x1="18" y1="194" x2="34" y2="194" />
    <line x1="50" y1="194" x2="98" y2="194" />
    <line x1="130" y1="194" x2="162" y2="194" />
    <line x1="178" y1="194" x2="194" y2="194" />
    <line x1="226" y1="194" x2="258" y2="194" />
    <line x1="274" y1="194" x2="322" y2="194" />
    <line x1="34" y1="210" x2="50" y2="210" />
    <line x1="82" y1="210" x2="130" y2="210" />
    <line x1="162" y1="210" x2="242" y2="210" />
    <line x1="258" y1="210" x2="274" y2="210" />
    <line x1="290" y1="210" x2="306" y2="210" />
    <line x1="18" y1="226" x2="66" y2="226" />
    <line x1="146" y1="226" x2="162" y2="226" />
    <line x1="178" y1="226" x2="210" y2="226" />
    <line x1="226" y1="226" x2="258" y2="226" />
    <line x1="306" y1="226" x2="322" y2="226" />
    <line x1="34" y1="242" x2="114" y2="242" />
    <line x1="194" y1="242" x2="242" y2="242" />
    <line x1="258" y1="242" x2="274" y2="242" />
    <line x1="290" y1="242" x2="306" y2="242" />
    <line x1="34" y1="258" x2="82" y2="258" />
    <line x1="114" y1="258" x2="194" y2="258" />
    <line x1="242" y1="258" x2="258" y2="258" />
    <line x1="274" y1="258" x2="290" y2="258" />
    <line x1="306" y1="258" x2="322" y2="258" />
    <line x1="2" y1="274" x2="34" y2="274" />
    <line x1="114" y1="274" x2="162" y2="274" />
    <line x1="194" y1="274" x2="210" y2="274" />
    <line x1="226" y1="274" x2="242" y2="274" />
    <line x1="258" y1="274" x2="274" y2="274" />
    <line x1="290" y1="274" x2="306" y2="274" />
    <line x1="34" y1="290" x2="66" y2="290" />
    <line x1="98" y1="290" x2="114" y2="290" />
    <line x1="146" y1="290" x2="226" y2="290" />
    <line x1="242" y1="290" x2="258" y2="290" />
    <line x1="274" y1="290" x2="290" y2="290" />
    <line x1="18" y1="306" x2="34" y2="306" />
    <line x1="50" y1="306" x2="66" y2="306" />
    <line x1="82" y1="306" x2="130" y2="306" />
    <line x1="162" y1="306" x2="226" y2="306" />
    <line x1="258" y1="306" x2="274" y2="306" />
    <line x1="290" y1="306" x2="322" y2="306" />
    <line x1="2" y1="322" x2="162" y2="322" />
    <line x1="178" y1="322" x2="322" y2="322" />
    <line x1="2" y1="2" x2="2" y2="322" />
    <line x1="18" y1="18" x2="18" y2="66" />
    <line x1="18" y1="82" x2="18" y2="114" />
    <line x1="18" y1="162" x2="18" y2="178" />
    <line x1="18" y1="194" x2="18" y2="226" />
    <line x1="18" y1="242" x2="18" y2="274" />
    <line x1="18" y1="290" x2="18" y2="306" />
    <line x1="34" y1="50" x2="34" y2="82" />
    <line x1="34" y1="146" x2="34" y2="210" />
    <line x1="34" y1="274" x2="34" y2="290" />
    <line x1="34" y1="306" x2="34" y2="322" />
    <line x1="50" y1="2" x2="50" y2="18" />
    <line x1="50" y1="50" x2="50" y2="66" />
    <line x1="50" y1="130" x2="50" y2="162" />
    <line x1="50" y1="178" x2="50" y2="194" />
    <line x1="50" y1="258" x2="50" y2="274" />
    <line x1="50" y1="290" x2="50" y2="306" />
    <line x1="66" y1="66" x2="66" y2="130" />
    <line x1="66" y1="146" x2="66" y2="178" />
    <line x1="66" y1="194" x2="66" y2="226" />
    <line x1="66" y1="274" x2="66" y2="290" />
    <line x1="82" y1="18" x2="82" y2="82" />
    <line x1="82" y1="98" x2="82" y2="114" />
    <line x1="82" y1="130" x2="82" y2="146" />
    <line x1="82" y1="226" x2="82" y2="306" />
    <line x1="98" y1="2" x2="98" y2="34" />
    <line x1="98" y1="82" x2="98" y2="98" />
    <line x1="98" y1="114" x2="98" y2="146" />
    <line x1="98" y1="210" x2="98" y2="226" />
    <line x1="98" y1="258" x2="98" y2="290" />
    <line x1="114" y1="18" x2="114" y2="66" />
    <line x1="114" y1="98" x2="114" y2="162" />
    <line x1="114" y1="178" x2="114" y2="210" />
    <line x1="114" y1="226" x2="114" y2="258" />
    <line x1="114" y1="274" x2="114" y2="290" />
    <line x1="130" y1="2" x2="130" y2="18" />
    <line x1="130" y1="50" x2="130" y2="66" />
    <line x1="130" y1="146" x2="130" y2="178" />
    <line x1="130" y1="194" x2="130" y2="242" />
    <line x1="130" y1="290" x2="130" y2="322" />
    <line x1="146" y1="18" x2="146" y2="50" />
    <line x1="146" y1="114" x2="146" y2="146" />
    <line x1="146" y1="162" x2="146" y2="178" />
    <line x1="146" y1="210" x2="146" y2="226" />
    <line x1="146" y1="242" x2="146" y2="258" />
    <line x1="146" y1="290" x2="146" y2="306" />
    <line x1="162" y1="18" x2="162" y2="114" />
    <line x1="162" y1="146" x2="162" y2="162" />
    <line x1="162" y1="178" x2="162" y2="210" />
    <line x1="162" y1="226" x2="162" y2="258" />
    <line x1="162" y1="274" x2="162" y2="290" />
    <line x1="162" y1="306" x2="162" y2="322" />
    <line x1="178" y1="2" x2="178" y2="18" />
    <line x1="178" y1="50" x2="178" y2="66" />
    <line x1="178" y1="130" x2="178" y2="194" />
    <line x1="178" y1="226" x2="178" y2="242" />
    <line x1="178" y1="258" x2="178" y2="274" />
    <line x1="194" y1="2" x2="194" y2="18" />
    <line x1="194" y1="66" x2="194" y2="82" />
    <line x1="194" y1="114" x2="194" y2="130" />
    <line x1="194" y1="258" x2="194" y2="274" />
    <line x1="210" y1="50" x2="210" y2="98" />
    <line x1="210" y1="130" x2="210" y2="162" />
    <line x1="210" y1="194" x2="210" y2="210" />
    <line x1="210" y1="226" x2="210" y2="258" />
    <line x1="226" y1="18" x2="226" y2="34" />
    <line x1="226" y1="50" x2="226" y2="82" />
    <line x1="226" y1="98" x2="226" y2="130" />
    <line x1="226" y1="162" x2="226" y2="194" />
    <line x1="226" y1="210" x2="226" y2="226" />
    <line x1="226" y1="258" x2="226" y2="306" />
    <line x1="242" y1="2" x2="242" y2="18" />
    <line x1="242" y1="34" x2="242" y2="50" />
    <line x1="242" y1="82" x2="242" y2="98" />
    <line x1="242" y1="114" x2="242" y2="178" />
    <line x1="242" y1="242" x2="242" y2="274" />
    <line x1="242" y1="290" x2="242" y2="322" />
    <line x1="258" y1="50" x2="258" y2="82" />
    <line x1="258" y1="98" x2="258" y2="162" />
    <line x1="258" y1="210" x2="258" y2="226" />
    <line x1="258" y1="242" x2="258" y2="258" />
    <line x1="258" y1="274" x2="258" y2="290" />
    <line x1="274" y1="18" x2="274" y2="50" />
    <line x1="274" y1="66" x2="274" y2="98" />
    <line x1="274" y1="114" x2="274" y2="146" />
    <line x1="274" y1="162" x2="274" y2="178" />
    <line x1="274" y1="194" x2="274" y2="210" />
    <line x1="274" y1="226" x2="274" y2="242" />
    <line x1="274" y1="258" x2="274" y2="274" />
    <line x1="274" y1="290" x2="274" y2="306" />
    <line x1="290" y1="18" x2="290" y2="82" />
    <line x1="290" y1="98" x2="290" y2="114" />
    <line x1="290" y1="130" x2="290" y2="162" />
    <line x1="290" y1="178" x2="290" y2="194" />
    <line x1="290" y1="210" x2="290" y2="274" />
    <line x1="290" y1="290" x2="290" y2="306" />
    <line x1="306" y1="50" x2="306" y2="82" />
    <line x1="306" y1="114" x2="306" y2="130" />
    <line x1="306" y1="162" x2="306" y2="178" />
    <line x1="306" y1="274" x2="306" y2="290" />
    <line x1="322" y1="2" x2="322" y2="322" />
    </g>
);

export default App;
   