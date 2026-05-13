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
// Add these to your state declarations at the top
const [view, setView] = useState('loading'); 
const [charName, setCharName] = useState('');
const [selectedClass, setSelectedClass] = useState(null);

const classes = [
  { id: 'barbarian', emoji: '🪓', color: '#e7623e' },
  { id: 'bard', emoji: '🪕', color: '#ab6dac' },
  { id: 'cleric', emoji: '🛡️', color: '#91a1b2' },
  { id: 'druid', emoji: '🍃', color: '#7a853b' },
  { id: 'fighter', emoji: '⚔️', color: '#7f513e' },
  { id: 'monk', emoji: '👊', color: '#5167cc' },
  { id: 'paladin', emoji: '✨', color: '#b59e54' },
  { id: 'ranger', emoji: '🏹', color: '#24592f' },
  { id: 'rogue', emoji: '🗡️', color: '#555752' },
  { id: 'sorcerer', emoji: '🔥', color: '#992e2e' },
  { id: 'warlock', emoji: '👁️', color: '#583377' },
  { id: 'wizard', emoji: '🧙‍♂️', color: '#2a50a1' },
  
];
  useEffect(() => {
    // 1. DEVICE & ROUTE DETECTION
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isJoinLink = window.location.pathname.includes('/join');

    if (isMobileDevice || isJoinLink) {
          setView('character-creation');
    } else {
      setView('lobby');
    }
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || window.location.pathname.includes('/join');
  


    // 2. SOCKET SETUP
    socketRef.current = io(SERVER_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-room', ROOM_ID);
    });
 
socketRef.current.on('update-players', (playersInRoom) => {
    console.log("Syncing Party:", playersInRoom);
    setAllPlayers(playersInRoom);
  });
  socketRef.current.on('player-moved', ({ id, pos }) => {
    setAllPlayers(prev => ({
      ...prev,
      [id]: { ...prev[id], ...pos }
    }));
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

const sendMove = (dir) => {
  if (socketRef.current) {
    console.log("Sending move:", dir); // Debugging
    socketRef.current.emit('send-move', { 
      roomId: ROOM_ID, 
      direction: dir 
    });
  }
};
  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setTimeout(() => {
      setRollResult(Math.floor(Math.random() * 20) + 1);
      setIsRolling(false);
    }, 600);
  };

  // --- RENDER LOGIC (THE 3 SCREENS) ---
if (view === 'character-creation') {
  const handleJoinParty = () => {
    if (!charName || !selectedClass) return;
    
    // Send character data to server
    socketRef.current.emit('player-details', {
      roomId: ROOM_ID,
      name: charName,
      classType: selectedClass.id,
      emoji: selectedClass.emoji
    });
    
    setView('mobile'); // Move to the controller
  };

  return (
    <div className="creation-screen">
      <div className="creation-glass">
        <h2 className="creation-title">MANIFEST HERO</h2>
        
        <input 
          type="text" 
          placeholder="Enter Hero Name..." 
          className="name-input"
          value={charName}
          onChange={(e) => setCharName(e.target.value)}
        />

        <div className="class-grid">
          {classes.map(c => (
            <button 
              key={c.id}
              className={`class-card ${selectedClass?.id === c.id ? 'selected' : ''}`}
              onClick={() => setSelectedClass(c)}
              style={{ '--class-color': c.color }}
            >
              <span className="class-emoji">{c.emoji}</span>
              <small className="class-label">{c.id}</small>
            </button>
          ))}
        </div>

        <button 
          className="join-btn" 
          disabled={!charName || !selectedClass}
          onClick={handleJoinParty}
        >
          ENTER THE LABYRINTH
        </button>
      </div>
    </div>
  );
}
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