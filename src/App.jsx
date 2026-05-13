import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';

const SERVER_URL = "https://dungeonmaze.onrender.com"; 
const ROOM_ID = "dnd-maze-1";

const CLASSES = [
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

function App() {
  const [view, setView] = useState('loading'); 
  const [allPlayers, setAllPlayers] = useState({});
  const [activeTab, setActiveTab] = useState('controller');
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(1);
  const [diceRotation, setDiceRotation] = useState({ x: 0, y: 0 });
  const [charName, setCharName] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  
  const socketRef = useRef();

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.location.pathname.includes('/join');
    
    socketRef.current = io(SERVER_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-room', ROOM_ID);
    });

    socketRef.current.on('update-players', (playersInRoom) => {
      setAllPlayers(playersInRoom);
    });

    socketRef.current.on('game-started', () => {
      if (!isMobile) setView('desktop');
    });

    setView(isMobile ? 'character-creation' : 'lobby');

    return () => socketRef.current.disconnect();
  }, []);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);

    const result = Math.floor(Math.random() * 6) + 1;
    const rotations = {
      1: [0, 0], 6: [0, 180], 3: [0, -90], 
      4: [0, 90], 2: [-90, 0], 5: [90, 0],
    };

    const [targetX, targetY] = rotations[result];
    setDiceRotation({ x: targetX + 720, y: targetY + 720 });

    setTimeout(() => {
      setRollResult(result);
      setIsRolling(false);
      setDiceRotation({ x: targetX, y: targetY }); 
    }, 1000);
  };

  const handleJoinParty = () => {
    if (!charName || !selectedClass) return;
    socketRef.current.emit('player-details', {
      roomId: ROOM_ID,
      name: charName,
      classType: selectedClass.id,
      emoji: selectedClass.emoji
    });
    setView('mobile');
  };

  const sendMove = (dir) => {
    socketRef.current.emit('send-move', { roomId: ROOM_ID, direction: dir });
  };

  // --- RENDER LOGIC ---

  if (view === 'loading') return <div className="loading">Summoning...</div>;

  if (view === 'character-creation') {
    return (
      <div className="creation-screen">
        <div className="creation-glass">
          <h2 className="creation-title">MANIFEST HERO</h2>
          <input 
            type="text" placeholder="Enter Hero Name..." className="name-input"
            value={charName} onChange={(e) => setCharName(e.target.value)}
          />
          <div className="class-grid">
            {CLASSES.map(c => (
              <button 
                key={c.id} className={`class-card ${selectedClass?.id === c.id ? 'selected' : ''}`}
                onClick={() => setSelectedClass(c)} style={{ '--class-color': c.color }}
              >
                <span className="class-emoji">{c.emoji}</span>
                <small className="class-label">{c.id}</small>
              </button>
            ))}
          </div>
          <button className="join-btn" disabled={!charName || !selectedClass} onClick={handleJoinParty}>
            ENTER THE LABYRINTH
          </button>
        </div>
      </div>
    );
  }

  if (view === 'mobile') {
    return (
      <div className="mobile-app-container">
        <main className="mobile-content">
          {activeTab === 'controller' && (
            <div className="controller-view">
              <div className="scene" onClick={rollDice}>
                <div className="dice" style={{ transform: `rotateX(${diceRotation.x}deg) rotateY(${diceRotation.y}deg)` }}>
                  <div className="face front">1</div>
                  <div className="face back">6</div>
                  <div className="face right">3</div>
                  <div className="face left">4</div>
                  <div className="face top">2</div>
                  <div className="face bottom">5</div>
                </div>
              </div>

              <div className="d-pad-wrapper">
                <button className="dir-btn up" onClick={() => sendMove('North')}>▲</button>
                <div className="d-pad-row">
                  <button className="dir-btn left" onClick={() => sendMove('West')}>◀</button>
                  <button className="dir-btn down" onClick={() => sendMove('South')}>▼</button>
                  <button className="dir-btn right" onClick={() => sendMove('East')}>▶</button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'character' && (
            <div className="tab-placeholder">
              <div className="hero-stat-card">
                <span style={{fontSize: '4rem'}}>{selectedClass?.emoji}</span>
                <h2>{charName}</h2>
                <p className="gold-text">{selectedClass?.id.toUpperCase()}</p>
              </div>
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

  if (view === 'lobby') {
    const playerCount = Object.keys(allPlayers).length;
    return (
      <div className="lobby-screen">
        <div className="fire-embers"></div>
        <div className="glass-container main-glow">
          <header className="lobby-header">
            <h1 className="game-title floating">LABYRINTH OF OATHS</h1>
            <p className="game-subtitle">The gate awaits the blood of the brave.</p>
          </header>

          <section className="steps-grid">
            <div className="step-card reveal">
              <div className="step-num">1</div>
              <h4>Link Soul</h4>
              <div className="step-visual">
                <QRCodeSVG value={`${window.location.origin}/join`} size={70} bgColor="transparent" fgColor="#d4af37" />
              </div>
            </div>
            <div className="step-card reveal">
              <div className="step-num">2</div>
              <h4>Manifest</h4>
              <div className="step-visual" style={{fontSize: '2rem'}}>🎭</div>
            </div>
            <div className="step-card reveal">
              <div className="step-num">3</div>
              <h4>Ascend</h4>
              <div className="step-visual" style={{fontSize: '2rem'}}>⚔️</div>
            </div>
          </section>

          <section className="team-section">
            <h3 className="section-divider"><span>Active Party</span></h3>
            <div className="player-cards-container">
              {Object.entries(allPlayers).map(([id, player], index) => (
                <div key={id} className="char-card active-player shimmer">
                  <div className="card-inner">
                    <div className="char-avatar">{player.emoji || '🧙‍♂️'}</div>
                    <div className="char-info">
                      <span className="char-name">{player.name || `Seeker ${index + 1}`}</span>
                      <div className="hp-bar-wrap"><div className="hp-fill"></div></div>
                      <span className="char-status">{player.classType?.toUpperCase() || "READY"}</span>
                    </div>
                  </div>
                </div>
              ))}
              {[...Array(Math.max(0, 4 - playerCount))].map((_, i) => (
                <div key={`empty-${i}`} className="char-card silhouette">
                  <div className="char-avatar">💀</div>
                  <p>Waiting for Soul...</p>
                </div>
              ))}
            </div>
          </section>

          <button className="begin-btn gold-pulse" onClick={() => socketRef.current.emit('start-game', ROOM_ID)} disabled={playerCount === 0}>
            RELEASE THE OATH
          </button>
        </div>
      </div>
    );
  }

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
                <div className="player-name-tag">{p.name || "???"}</div>
                <span className="emoji">{p.emoji || '🧙‍♂️'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
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