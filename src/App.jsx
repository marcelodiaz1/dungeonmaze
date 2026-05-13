import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';

const SERVER_URL = "https://dungeonmaze.onrender.com"; 
const ROOM_ID = "dnd-maze-1";

function App() {
  const [view, setView] = useState('lobby');
  const [allPlayers, setAllPlayers] = useState({});
  const socketRef = useRef();

  useEffect(() => {
  // Check routing
  if (window.location.pathname.includes('/join')) setView('mobile');

  // Connect
  socketRef.current = io(SERVER_URL, {
    transports: ['websocket'], // Forces a faster connection
  });

  // When we connect, the server should send the current player list
  socketRef.current.on('connect', () => {
    console.log("Connected as:", socketRef.current.id);
    socketRef.current.emit('join-room', ROOM_ID);
  });

  socketRef.current.on('update-players', (playersMap) => {
    console.log("Players updated:", playersMap);
    setAllPlayers(playersMap);
  });

  // Listen for individual movements
  socketRef.current.on('player-moved', ({ id, pos }) => {
    setAllPlayers(prev => ({
      ...prev,
      [id]: { ...prev[id], ...pos }
    }));
  });

  return () => socketRef.current.disconnect();
}, []);
  // Tell the server to start the game for everyone
  const handleStartAdventure = () => {
    socketRef.current.emit('start-game', ROOM_ID);
    setView('desktop'); // Move the local screen immediately
  };

  const sendMove = (dir) => socketRef.current.emit('send-move', { roomId: ROOM_ID, direction: dir });

  // --- VIEW: MOBILE ---
if (view === 'mobile') {
  const [activeTab, setActiveTab] = useState('controller');
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(20);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    // Simulate a chaotic roll
    setTimeout(() => {
      setRollResult(Math.floor(Math.random() * 20) + 1);
      setIsRolling(false);
    }, 600);
  };

  return (
    <div className="mobile-app-container">
      {/* 1. Header with Stats */}
      <header className="mobile-stats-bar">
        <div className="stat-pill hp">❤️ 10/10</div>
        <div className="stat-pill mp">✨ 5/5</div>
        <div className="stat-pill xp">⭐ LVL 1</div>
      </header>

      {/* 2. Main Content Area */}
      <main className="mobile-content">
        {activeTab === 'controller' && (
          <div className="controller-view fade-in">
            <div className="d20-container" onClick={rollDice}>
              <div className={`d20 ${isRolling ? 'rolling' : ''}`}>
                <span className="roll-number">{rollResult}</span>
              </div>
              <p className="dice-hint">Tap to Roll D20</p>
            </div>
            
            <div className="d-pad">
              <button className="dir-btn up" onClick={() => sendMove('North')}>▲</button>
              <button className="dir-btn left" onClick={() => sendMove('West')}>◀</button>
              <button className="dir-btn right" onClick={() => sendMove('East')}>▶</button>
              <button className="dir-btn down" onClick={() => sendMove('South')}>▼</button>
            </div>
          </div>
        )}

        {activeTab === 'character' && (
          <div className="tab-panel fade-in">
            <h2 className="tab-title">Character Sheet</h2>
            <div className="sheet-row"><span>Strength</span><strong>14</strong></div>
            <div className="sheet-row"><span>Agility</span><strong>12</strong></div>
            <div className="sheet-row"><span>Wisdom</span><strong>18</strong></div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="tab-panel fade-in">
            <h2 className="tab-title">Inventory</h2>
            <div className="inv-grid">
              <div className="inv-slot">🗡️</div>
              <div className="inv-slot">🧪</div>
              <div className="inv-slot">🕯️</div>
              <div className="inv-slot empty"></div>
            </div>
          </div>
        )}

        {activeTab === 'tome' && (
          <div className="tab-panel fade-in">
            <h2 className="tab-title">The Tome</h2>
            <div className="log-entry">You entered the Labyrinth.</div>
            <div className="log-entry">The air feels cold...</div>
          </div>
        )}
      </main>

      {/* 3. Bottom Navigation Menu */}
      <nav className="mobile-nav">
        <button onClick={() => setActiveTab('controller')} className={activeTab === 'controller' ? 'active' : ''}>
          <span>🎲</span><small>Play</small>
        </button>
        <button onClick={() => setActiveTab('character')} className={activeTab === 'character' ? 'active' : ''}>
          <span>👤</span><small>Hero</small>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'active' : ''}>
          <span>🎒</span><small>Items</small>
        </button>
        <button onClick={() => setActiveTab('tome')} className={activeTab === 'tome' ? 'active' : ''}>
          <span>📜</span><small>Tome</small>
        </button>
      </nav>
    </div>
  );
}
  // --- VIEW: LOBBY --- 
 if (view === 'lobby') {
  const playerCount = Object.keys(allPlayers).length;
  const maxSlots = 4;
  const emptySlots = Math.max(0, maxSlots - playerCount);

  return (
    <div className="lobby-screen">
      {/* Animated Background Elements */}
      <div className="fire-embers"></div>
      
      <div className="glass-container main-glow">
        <header className="lobby-header">
          <h1 className="game-title floating">LABYRINTH OF OATHS</h1>
          <div className="title-separator"></div>
          <p className="game-subtitle">The gate awaits the blood of the brave.</p>
        </header>

        <section className="steps-grid">
          {[
            { n: 1, t: "Link Soul", d: "Scan the ancient glyph", icon: <QRCodeSVG value={`${window.location.origin}/join`} size={70} bgColor="transparent" fgColor="#d4af37" /> },
            { n: 2, t: "Manifest", d: "Shape your avatar", icon: "🎭" },
            { n: 3, t: "Ascend", d: "Enter the void", icon: "⚔️" }
          ].map(step => (
            <div className="step-card reveal" key={step.n}>
              <div className="step-num">{step.n}</div>
              <h4>{step.t}</h4>
              <div className="step-visual">{step.icon}</div>
              <p>{step.d}</p>
            </div>
          ))}
        </section>

        <section className="team-section">
          <h3 className="section-divider"><span>Active Party</span></h3>
          <div className="player-cards-container">
            {Object.entries(allPlayers).map(([id, player], index) => (
              <div key={id} className="char-card active-player shimmer">
                <div className="card-inner">
                  <div className="char-avatar">{player.emoji || '🧙‍♂️'}</div>
                  <div className="char-info">
                    <span className="char-name">Seeker {index + 1}</span>
                    <div className="hp-bar-wrap"><div className="hp-fill"></div></div>
                    <span className="char-status">READY</span>
                  </div>
                </div>
              </div>
            ))}

            {[...Array(emptySlots)].map((_, i) => (
              <div key={`empty-${i}`} className="char-card silhouette">
                <div className="char-avatar">?</div>
                <p>Waiting for Soul...</p>
              </div>
            ))}
          </div>
        </section>

        <button 
          className="begin-btn gold-pulse" 
          onClick={handleStartAdventure}
          disabled={playerCount === 0}
        >
          RELEASE THE OATH
        </button>
      </div>
    </div>
  );
}

// --- VIEW: DESKTOP MAZE ---
  return (
    <div className="desktop-board">
      <div className="game-screen">
        <div className="isometric-wrapper">
          <div className="maze-container">
            <svg viewBox="0 0 324 324" className="maze-svg-walls">
              <g className="wall-top-layer"><MazeGeometry /></g>
            </svg>
            
            {Object.entries(allPlayers).map(([id, p]) => (
              <div 
                key={id} 
                className="player-avatar" 
                style={{ 
                  left: `${(p.x / 324) * 100}%`, 
                  top: `${(p.y / 324) * 100}%` 
                }}
              >
                <span className="emoji">{p.emoji || '🧙‍♂️'}</span>
                {/* Visual indicator for the local player */}
                {id === socketRef.current.id && <div className="me-indicator">YOU</div>}
              </div>
            ))}
          </div>
        </div>

        {/* NEW: Connected Users Sidebar */}
        <div className="dm-log">
          <h3>Party Members</h3>
          <div className="messages">
            {Object.entries(allPlayers).map(([id, p], index) => (
              <div key={id} className="msg">
                <span style={{fontSize: '1.5rem'}}>{p.emoji}</span> 
                <strong> Player {index + 1}</strong>
                <br />
                <small style={{opacity: 0.5}}>{id === socketRef.current.id ? "(You)" : id.slice(0, 6)}</small>
              </div>
            ))}
          </div>
          <div className="join-footer" style={{position: 'static', marginTop: '20px'}}>
             <p style={{fontSize: '0.8rem', color: 'black'}}>Room: {ROOM_ID}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
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