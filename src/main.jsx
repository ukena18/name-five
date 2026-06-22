import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Check, ChevronLeft, Flame, Lightbulb, Pause, Play, RotateCcw, Settings, Share2, Sparkles, Timer, Trophy, Volume2, VolumeX, X } from 'lucide-react';
import './styles.css';

const PROMPTS = [
  ['things that have grooves', 'texture'], ['things that have ridges', 'texture'], ['things that feel rough', 'texture'], ['things that are silky', 'texture'], ['things that can be sticky', 'texture'],
  ['places you can find a drink', 'places'], ['places that are usually quiet', 'places'], ['places that smell interesting', 'places'], ['places with long lines', 'places'], ['places you might get lost', 'places'],
  ['things that glow', 'sight'], ['things that are bright yellow', 'sight'], ['things that are transparent', 'sight'], ['things with stripes', 'sight'], ['things that sparkle', 'sight'],
  ['sounds you hear in the morning', 'sound'], ['things that make a tiny sound', 'sound'], ['things that make a deep sound', 'sound'], ['sounds that relax you', 'sound'], ['things louder than a vacuum', 'sound'],
  ['things that smell sweet', 'senses'], ['things that taste sour', 'senses'], ['things that smell like summer', 'senses'], ['things that feel cold', 'senses'], ['things with a spicy flavor', 'senses'],
  ['things you can fold', 'action'], ['things that spin', 'action'], ['things you can stack', 'action'], ['things that bounce', 'action'], ['things you can squeeze', 'action'],
  ['things that improve with age', 'ideas'], ['things worth waiting for', 'ideas'], ['things that make people curious', 'ideas'], ['things that are hard to explain', 'ideas'], ['things that feel like freedom', 'ideas'],
  ['things found in a backpack', 'everyday'], ['things with buttons', 'everyday'], ['things smaller than your hand', 'everyday'], ['things that need charging', 'everyday'], ['things that come in pairs', 'everyday'],
  ['animals with unusual movement', 'nature'], ['things that grow quickly', 'nature'], ['things found near water', 'nature'], ['things that change with the seasons', 'nature'], ['things with a shell', 'nature'],
  ['ways to say “happy” without saying it', 'words'], ['words that sound fast', 'words'], ['ways to describe the color blue', 'words'], ['words that feel cozy', 'words'], ['ways to describe a storm', 'words']
];

const COLORS = ['coral', 'blue', 'gold', 'purple', 'green'];
const getStats = () => JSON.parse(localStorage.getItem('nameFiveStats') || '{"wins":0,"streak":0,"best":0}');

function App() {
  const [screen, setScreen] = useState('home');
  const [duration, setDuration] = useState(60);
  const [custom, setCustom] = useState(90);
  const [sound, setSound] = useState(true);
  const [cardIndex, setCardIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [seconds, setSeconds] = useState(60);
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(getStats);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const endRef = useRef(false);

  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (!running || seconds <= 0 || result) return;
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds, result]);

  useEffect(() => {
    if (seconds === 0 && !result && screen === 'game') finish(false);
  }, [seconds]);

  const blip = (pitch = 500, length = .08) => {
    if (!sound) return;
    try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = pitch; g.gain.setValueAtTime(.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + length); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + length); } catch {}
  };

  const chooseNext = () => {
    let next;
    do next = Math.floor(Math.random() * PROMPTS.length); while (next === cardIndex);
    setCardIndex(next);
  };

  const startGame = () => {
    const d = duration === 'custom' ? Math.max(10, Math.min(600, Number(custom) || 60)) : duration;
    setSeconds(d); setCount(0); setResult(null); setRunning(true); endRef.current = false; chooseNext(); setScreen('game');
  };

  const finish = (won) => {
    if (endRef.current) return;
    endRef.current = true; setRunning(false); setResult(won ? 'win' : 'time');
    blip(won ? 760 : 180, .25);
    if (navigator.vibrate) navigator.vibrate(won ? [80, 40, 80] : 120);
    const next = won
      ? { wins: stats.wins + 1, streak: stats.streak + 1, best: Math.max(stats.best, stats.streak + 1) }
      : { ...stats, streak: 0 };
    setStats(next); localStorage.setItem('nameFiveStats', JSON.stringify(next));
  };

  const addOne = () => {
    if (!running || result) return;
    const next = count + 1; setCount(next); blip(420 + next * 70); if (navigator.vibrate) navigator.vibrate(25);
    if (next === 5) finish(true);
  };

  const format = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const total = duration === 'custom' ? Math.max(10, Math.min(600, Number(custom) || 60)) : duration;
  const progress = Math.max(0, seconds / total);
  const prompt = PROMPTS[cardIndex];

  if (screen === 'game') return <main className="app game-screen">
    <header className="game-header">
      <button className="icon-btn" aria-label="Back" onClick={() => { setRunning(false); setScreen('home'); }}><ChevronLeft /></button>
      <div className={`timer-pill ${seconds <= 10 ? 'urgent' : ''}`}><Timer size={17}/><strong>{format(seconds)}</strong></div>
      <button className="icon-btn" aria-label={sound ? 'Mute' : 'Turn sound on'} onClick={() => setSound(!sound)}>{sound ? <Volume2/> : <VolumeX/>}</button>
    </header>

    <section className="play-area">
      <p className="eyebrow">NAME FIVE</p>
      <article className={`prompt-card ${COLORS[cardIndex % COLORS.length]} ${result === 'win' ? 'celebrate' : ''}`}>
        <span className="quote">“</span><h1>{prompt[0]}</h1><span className="category">{prompt[1]}</span>
      </article>
      <div className="dots" aria-label={`${count} of 5 answers`}>
        {[0,1,2,3,4].map(i => <span key={i} className={i < count ? 'filled' : ''}>{i < count && <Check size={18}/>}</span>)}
      </div>

      {!result ? <>
        <button className="answer-btn" onClick={addOne}><span>I named one!</span><b>{count}<small>/5</small></b></button>
        <div className="game-actions">
          <button onClick={() => setRunning(!running)}>{running ? <Pause/> : <Play/>}{running ? 'Pause' : 'Resume'}</button>
          <button onClick={() => { chooseNext(); setCount(0); blip(260); }}><RotateCcw/>New card</button>
        </div>
      </> : <div className="result-panel">
        <Sparkles className="sparkle" />
        <h2>{result === 'win' ? 'Five alive!' : `You got ${count} of 5`}</h2>
        <p>{result === 'win' ? `That’s a ${stats.streak}-round streak. Your brain is cooking.` : 'Good stretch. Every answer makes the next one easier.'}</p>
        <button className="primary" onClick={startGame}>Play another <ArrowRight/></button>
        <button className="text-btn" onClick={() => setScreen('home')}>Back home</button>
      </div>}
    </section>
    <div className="time-track"><span style={{transform:`scaleX(${progress})`}} /></div>
  </main>;

  return <main className="app home-screen">
    <header className="topbar"><div className="brand"><span>5</span> NAME FIVE</div><button className="icon-btn" aria-label="How to play" onClick={() => setShowHelp(true)}><Lightbulb/></button></header>
    <section className="hero">
      <div className="mini-card one">5 things<br/>that glow</div><div className="mini-card two">5 places<br/>to hide</div>
      <p className="eyebrow">THE QUICK THINKING GAME</p>
      <h1>How many ways<br/>can you <em>see it?</em></h1>
      <p className="intro">Stretch your vocabulary, notice more, and think on your feet — five answers at a time.</p>
    </section>

    <section className="setup-card">
      <div className="setup-title"><div><span>01</span><h2>Pick your time</h2></div><Settings size={21}/></div>
      <div className="time-options">
        {[60,120,180].map(t => <button key={t} className={duration === t ? 'active' : ''} onClick={() => setDuration(t)}><strong>{t/60}</strong><span>MIN</span></button>)}
        <button className={duration === 'custom' ? 'active' : ''} onClick={() => setDuration('custom')}><strong>±</strong><span>CUSTOM</span></button>
      </div>
      {duration === 'custom' && <label className="custom-time">Seconds <input type="number" min="10" max="600" value={custom} onChange={e => setCustom(e.target.value)} /></label>}
      <button className="primary start" onClick={startGame}>Draw a card <ArrowRight/></button>
    </section>

    <section className="stats-row">
      <div><Flame/><span><b>{stats.streak}</b> current streak</span></div>
      <div><Trophy/><span><b>{stats.best}</b> personal best</span></div>
    </section>

    <footer>
      {installPrompt ? <button className="install" onClick={async () => { await installPrompt.prompt(); setInstallPrompt(null); }}><Share2/> Install this app</button> : <p>Offline-ready · Install from Chrome’s menu</p>}
    </footer>

    {showHelp && <div className="modal-wrap" onClick={() => setShowHelp(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setShowHelp(false)}><X/></button><p className="eyebrow">HOW TO PLAY</p><h2>Five is the magic number.</h2><ol><li>Choose your timer and draw a card.</li><li>Say an answer out loud, then tap <b>“I named one!”</b></li><li>Name all five before the clock runs out.</li></ol><p className="tip">Play solo, pass the phone around, or ask a friend to judge the creative answers.</p><button className="primary" onClick={() => setShowHelp(false)}>Got it</button></div></div>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
