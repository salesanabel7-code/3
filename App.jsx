import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Volume2, Clock, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react';
import * as THREE from 'three';

const App = () => {
  const [view, setView] = useState('home'); // home, letter, gallery
  const [theme, setTheme] = useState('Sweetheart');
  const [timeLeft, setTimeLeft] = useState("");
  const canvasRef = useRef(null);
  const apiKey = "";

  const themes = {
    Sweetheart: { color: "#ff69b4", bg: "from-pink-900 via-black to-rose-950", accent: "text-pink-400", pulse: 1.2 },
    Eternity: { color: "#9370db", bg: "from-purple-900 via-black to-indigo-950", accent: "text-purple-400", pulse: 0.8 },
    Passion: { color: "#ff0000", bg: "from-red-900 via-black to-black", accent: "text-red-500", pulse: 2.0 },
  };

  const currentTheme = themes[theme];

  // Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date();
      target.setDate(target.getDate() + (5 + 7 - target.getDay()) % 7);
      target.setHours(18, 0, 0, 0);
      const diff = target - new Date();
      if (diff <= 0) {
        setTimeLeft("Time to see Ruth!");
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Three.js Background
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, -0.3, -0.6, -0.3, -0.6, 0);
    heartShape.bezierCurveTo(-0.6, 0.3, 0, 0.6, 0, 1);
    heartShape.bezierCurveTo(0, 0.6, 0.6, 0.3, 0.6, 0);
    heartShape.bezierCurveTo(0.6, -0.3, 0, -0.3, 0, 0);

    const geometry = new THREE.ExtrudeGeometry(heartShape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.05 });
    const material = new THREE.MeshStandardMaterial({ 
      color: currentTheme.color, 
      metalness: 0.8, 
      roughness: 0.2 
    });
    const heartMesh = new THREE.Mesh(geometry, material);
    heartMesh.rotation.x = Math.PI;
    heartMesh.scale.set(2, 2, 2);
    scene.add(heartMesh);

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    let frameId;
    const animate = () => {
      heartMesh.rotation.y += 0.01;
      const pulse = 2 + Math.sin(Date.now() * 0.002 * currentTheme.pulse) * 0.2;
      heartMesh.scale.set(pulse, pulse, pulse);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  const speak = async () => {
    const text = "Hi Ruth! Jude here. I built this special 3D world just for you. Every heart represents how much I value you. Judenet IntelliSoft Solutions at your service.";
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } } },
          model: "gemini-2.5-flash-preview-tts"
        })
      });
      const data = await res.json();
      const pcm = data.candidates[0].content.parts[0].inlineData.data;
      const binary = atob(pcm);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      const wavHeader = (len) => {
        const b = new ArrayBuffer(44); const v = new DataView(b);
        const s = (o, str) => { for(let i=0; i<str.length; i++) v.setUint8(o+i, str.charCodeAt(i)); };
        s(0, 'RIFF'); v.setUint32(4, 36+len, true); s(8, 'WAVE'); s(12, 'fmt ');
        v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, 24000, true); v.setUint32(28, 48000, true); v.setUint16(32, 2, true);
        v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, len, true);
        return b;
      };
      const audio = new Audio(URL.createObjectURL(new Blob([wavHeader(binary.length), array], { type: 'audio/wav' })));
      audio.play();
    } catch (e) { console.error(e); }
  };

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-between p-6 bg-gradient-to-b ${currentTheme.bg} text-white overflow-hidden`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Top Branding */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="relative z-10 w-full flex justify-between items-center"
      >
        <div className="flex flex-col">
          <span className={`text-xs font-black tracking-[0.3em] uppercase ${currentTheme.accent}`}>Ruth</span>
          <span className="text-[7px] tracking-[0.4em] opacity-40 uppercase">Judenet IntelliSoft Solutions</span>
        </div>
        <button onClick={speak} className="p-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
          <Volume2 size={18} />
        </button>
      </motion.header>

      {/* Main Experience */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-center"
            >
              <button 
                onClick={() => setView('letter')}
                className="px-10 py-5 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 shadow-2xl group"
              >
                <span className="flex items-center gap-3 text-[10px] font-black tracking-[0.4em] uppercase">
                  Open Experience <Heart size={14} className="fill-current text-pink-500" />
                </span>
              </button>
            </motion.div>
          )}

          {view === 'letter' && (
            <motion.div 
              key="letter"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="w-full max-w-sm p-8 bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl text-center"
            >
              <Sparkles className={`mx-auto mb-4 ${currentTheme.accent}`} size={24} />
              <h2 className="text-2xl font-serif italic mb-4">Dearest Ruth</h2>
              <p className="text-sm leading-relaxed text-white/70 italic mb-8">
                "Meeting you was the best part of my story. I built this digital sanctuary so you'd always have a place that celebrates how special you are. You shine brighter than any code I've ever written."
              </p>
              <div className="flex gap-3">
                <button onClick={() => setView('gallery')} className="flex-1 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest">See Memories</button>
                <button onClick={() => setView('home')} className="p-4 bg-white/10 rounded-2xl"><X size={16} /></button>
              </div>
            </motion.div>
          )}

          {view === 'gallery' && (
            <motion.div 
              key="gallery"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="w-full max-w-sm p-6 bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-6 border border-white/10">
                <img src="IMG-20260228-WA0008.jpg" alt="Ruth" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-[10px] italic font-serif">"The smile that powers my world."</p>
                </div>
              </div>
              <button onClick={() => setView('letter')} className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">Back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Controls */}
      <footer className="relative z-10 w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-[9px] font-black tracking-widest uppercase">
            <Clock size={12} className={currentTheme.accent} /> {timeLeft}
          </div>
        </div>

        <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10">
          {Object.keys(themes).map(t => (
            <button 
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 py-3.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-tighter transition-all duration-300 ${theme === t ? 'bg-white text-black scale-100 shadow-xl' : 'text-white/40'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default App;
