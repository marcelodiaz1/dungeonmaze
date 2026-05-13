import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';

const SERVER_URL = "https://dungeonmaze.onrender.com"; 
const ROOM_ID = "dnd-maze-1";


function App() {
  const [view, setView] = useState('loading'); // loading, lobby, desktop, mobile
  const [allPlayers, setAllPlayers] = useState({});
  const [activeTab, setActiveTab] = useState('controller');
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(20);
  const socketRef = useRef();

  useEffect(() => {
    // 1. DEVICE & ROUTE DETECTION
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isJoinLink = window.location.pathname.includes('/join');

    if (isMobileDevice || isJoinLink) {
      setView('mobile');
    } else {
      setView('lobby');
    }

    // 2. SOCKET SETUP
    socketRef.current = io(SERVER_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-room', ROOM_ID);
    });

    socketRef.current.on('update-players', (playersMap) => {
      setAllPlayers(playersMap);
    });

    socketRef.current.on('game-started', () => {
      // Only redirect the Desktop to the maze; Mobile stays on controller
      const isMobileDevice = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (!isMobileDevice) {
        setView('desktop');
      }
    });

    return () => socketRef.current.disconnect();
  }, []);

  // --- ACTIONS ---
  const handleStartAdventure = () => {
    socketRef.current.emit('start-game', ROOM_ID);
    setView('desktop');
  };

  const sendMove = (dir) => socketRef.current.emit('send-move', { roomId: ROOM_ID, direction: dir });

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setTimeout(() => {
      setRollResult(Math.floor(Math.random() * 20) + 1);
      setIsRolling(false);
    }, 600);
  };

  // --- RENDER LOGIC (THE 3 SCREENS) ---

  // SCREEN 1: MOBILE CONTROLLER
  if (view === 'mobile') {
    return (
      <div className="mobile-app-container">
        <header className="mobile-stats-bar">
          <div className="stat-pill hp">❤️ 10/10</div>
          <div className="stat-pill mp">✨ 5/5</div>
          <div className="stat-pill xp">⭐ LVL 1</div>
        </header>
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
        <nav className="mobile-nav">
          <button onClick={() => setActiveTab('controller')} className={activeTab === 'controller' ? 'active' : ''}><span>🎲</span><small>Play</small></button>
          <button onClick={() => setActiveTab('character')} className={activeTab === 'character' ? 'active' : ''}><span>👤</span><small>Hero</small></button>
          <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'active' : ''}><span>🎒</span><small>Items</small></button>
          <button onClick={() => setActiveTab('tome')} className={activeTab === 'tome' ? 'active' : ''}><span>📜</span><small>Tome</small></button>
        </nav>
      </div>
    );
  }

  // SCREEN 2: DESKTOP LOBBY
  if (view === 'lobby') {
    const playerCount = Object.keys(allPlayers).length;
    return (
      <div className="lobby-screen">
        <div className="fire-embers"></div>
        <div className="glass-container">
          <h1 className="game-title floating">LABYRINTH OF OATHS</h1>
          <div className="title-separator"></div>
          <div className="qr-section">
            <QRCodeSVG value={`${window.location.origin}/join`} size={150} fgColor="#d4af37" bgColor="transparent" />
            <p>Scan to Join the Party</p>
          </div>
          <div className="player-cards-container">
            {Object.entries(allPlayers).map(([id, p]) => (
              <div key={id} className="char-card active">
                <div className="char-avatar">{p.emoji || '🧙‍♂️'}</div>
                <div className="hp-bar-wrap"><div className="hp-fill"></div></div>
              </div>
            ))}
          </div>
          <button className="begin-btn" onClick={handleStartAdventure} disabled={playerCount === 0}>
            RELEASE THE OATH
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 3: DESKTOP MAZE (GAME ON)
  if (view === 'desktop') {
    return (
      <div className="desktop-board">
        <div className="game-screen">
          <div className="maze-container">
            <svg viewBox="0 0 324 324" className="maze-svg-walls">
              <MazeGeometry />
            </svg>
            {Object.entries(allPlayers).map(([id, p]) => (
              <div key={id} className="player-avatar" style={{ left: `${(p.x / 324) * 100}%`, top: `${(p.y / 324) * 100}%` }}>
                <span className="emoji">{p.emoji}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default Loading state
  return <div className="loading">Summoning...</div>;
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