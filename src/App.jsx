import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================================\n// 🐦 Shimaenaga Math App — variants, name tags, SFX & BGM, PWA hooks\n// ==========================================================\n
// -----------------------------
// 🐦 シマエナガ SVG（バリエーション対応）
// -----------------------------
const ShimaenagaSVG = ({ size = 56, blink = false, variant = {} }) => {
  const {
    wing = "flat", // flat | up | down
    tail = "down", // down | left | right
    eye = "open", // open | wink | closed
    cheek = "#fecaca",
    accessory = "none", // none | scarf | leaf | star | hat
    accessoryColor = "#60a5fa",
  } = variant;

  const wingAngleL = wing === "up" ? -25 : wing === "down" ? 25 : 0;
  const wingAngleR = -wingAngleL;
  const tailAngle = tail === "left" ? -18 : tail === "right" ? 18 : 0;
  const eyeY = 23;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="シマエナガ">
      <defs>
        <radialGradient id="g" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopOpacity="1" stopColor="#fff" />
          <stop offset="100%" stopOpacity="1" stopColor="#f3f4f6" />
        </radialGradient>
      </defs>

      {/* body */}
      <circle cx="32" cy="28" r="20" fill="url(#g)" stroke="#111827" strokeWidth="2" />

      {/* wings */}
      <ellipse cx="16" cy="30" rx="7" ry="5" fill="#e5e7eb" stroke="#111827" strokeWidth="2" transform={`rotate(${wingAngleL} 16 30)`} />
      <ellipse cx="48" cy="30" rx="7" ry="5" fill="#e5e7eb" stroke="#111827" strokeWidth="2" transform={`rotate(${wingAngleR} 48 30)`} />

      {/* tail */}
      <rect x="29" y="44" width="6" height="14" rx="3" fill="#111827" transform={`rotate(${tailAngle} 32 51)`} />

      {/* eyes */}
      {eye === "open" && (
        <>
          <circle cx="24" cy={blink ? eyeY + 3 : eyeY} r={blink ? 2 : 3.5} fill="#111827" />
          <circle cx="40" cy={blink ? eyeY + 3 : eyeY} r={blink ? 2 : 3.5} fill="#111827" />
        </>
      )}
      {eye === "wink" && (
        <>
          <rect x="20" y={eyeY - 1} width="8" height="2" rx="1" fill="#111827" />
          <circle cx="40" cy={eyeY} r={3.5} fill="#111827" />
        </>
      )}
      {eye === "closed" && (
        <>
          <rect x="20" y={eyeY - 1} width="8" height="2" rx="1" fill="#111827" />
          <rect x="36" y={eyeY - 1} width="8" height="2" rx="1" fill="#111827" />
        </>
      )}

      {/* cheeks */}
      <circle cx="20" cy="34" r="3" fill={cheek} />
      <circle cx="44" cy="34" r="3" fill={cheek} />

      {/* beak */}
      <polygon points="30,28 34,28 32,31" fill="#111827" />

      {/* accessories */}
      {accessory === "scarf" && (
        <path d="M18 36 C 24 38, 40 38, 46 36 L 44 40 C 36 42, 28 42, 20 40 Z" fill={accessoryColor} opacity="0.9" />
      )}
      {accessory === "leaf" && (
        <g transform="translate(36,22) rotate(-20)">
          <ellipse cx="6" cy="-6" rx="5" ry="3" fill={accessoryColor} />
          <rect x="0" y="-8" width="2" height="8" fill="#166534" />
        </g>
      )}
      {accessory === "star" && (
        <polygon points="32,6 34,11 39,11 35,14 36,19 32,16 28,19 29,14 25,11 30,11" fill={accessoryColor} />
      )}
      {accessory === "hat" && (
        <g transform="translate(32,12)">
          <rect x="-10" y="6" width="20" height="3" fill="#111827" />
          <polygon points="0,0 -7,6 7,6" fill={accessoryColor} />
        </g>
      )}
    </svg>
  );
};

// -----------------------------
// 🔊 効果音（アセット不要 / WebAudio）
// -----------------------------
function useSFX() {
  const ctxRef = useRef(null);
  const ensure = () => {
    if (typeof window === "undefined") return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!ctxRef.current) ctxRef.current = new Ctx();
    if (ctxRef.current.state === "suspended") { try { ctxRef.current.resume(); } catch {} }
    return ctxRef.current;
  };
  const tone = (freq = 440, dur = 0.12, type = "sine", gain = 0.06, delay = 0) => {
    const ctx = ensure(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(ctx.destination);
    const t0 = ctx.currentTime + delay;
    try {
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    } catch {}
    o.start(t0); o.stop(t0 + dur + 0.02);
  };
  const success = () => { tone(660,0.10,"sine",0.08,0); tone(880,0.09,"triangle",0.06,0.12); tone(1320,0.12,"sine",0.05,0.24); };
  const error = () => { tone(140,0.18,"sawtooth",0.07,0); tone(110,0.22,"sawtooth",0.06,0.05); };
  const party = () => { for (let i=0;i<6;i++) tone(600+i*110,0.06,"square",0.05,i*0.06); };
  return { success, error, party, ensure };
}

// -----------------------------
// 🎵 アップテンポBGM（簡易シーケンサー / WebAudio）
// -----------------------------
function useBGM(initialTempo = 145) {
  const ctxRef = useRef(null);
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const tempoRef = useRef(initialTempo);
  const stepRef = useRef(0);
  const timerRef = useRef(null);
  const noiseBufRef = useRef(null);

  const ensureCtx = () => {
    if (typeof window === "undefined") return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!ctxRef.current) ctxRef.current = new Ctx();
    if (ctxRef.current.state === "suspended") { try { ctxRef.current.resume(); } catch {} }
    if (!noiseBufRef.current && ctxRef.current) {
      const len = 0.15 * ctxRef.current.sampleRate;
      const buf = ctxRef.current.createBuffer(1, len, ctxRef.current.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      noiseBufRef.current = buf;
    }
    return ctxRef.current;
  };

  const playKick = (t) => {
    const ctx = ensureCtx(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.2);
  };
  const playSnare = (t) => {
    const ctx = ensureCtx(); if (!ctx) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBufRef.current; const bp = ctx.createBiquadFilter();
    bp.type = "highpass"; bp.frequency.value = 1800; const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination); src.start(t); src.stop(t + 0.08);
  };
  const playHat = (t) => {
    const ctx = ensureCtx(); if (!ctx) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBufRef.current; const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    src.connect(hp); hp.connect(g); g.connect(ctx.destination); src.start(t); src.stop(t + 0.04);
  };
  const playPluck = (t, freq) => {
    const ctx = ensureCtx(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "triangle"; o.frequency.value = freq; g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.14);
  };

  const seqNotes = [0, 4, 7, 12, 7, 4, 0, 4];

  const tick = () => {
    const ctx = ensureCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    const step = stepRef.current % 16;
    playHat(t);
    if (step % 4 === 0) playKick(t);
    if (step === 4 || step === 12) playSnare(t);
    if ([0, 3, 6, 9, 12].includes(step)) {
      const root = 440;
      const n = seqNotes[(Math.floor(step / 3) + Math.floor(stepRef.current / 16)) % seqNotes.length];
      const freq = root * Math.pow(2, n / 12);
      playPluck(t, freq);
    }
    stepRef.current++;
  };

  const computeInterval = () => (60 / tempoRef.current / 4) * 1000; // 16th note

  const start = () => {
    if (playingRef.current) return;
    ensureCtx();
    const iv = computeInterval();
    timerRef.current = setInterval(tick, iv);
    playingRef.current = true; setPlaying(true);
  };
  const stop = () => {
    if (!playingRef.current) return;
    clearInterval(timerRef.current); timerRef.current = null; playingRef.current = false; setPlaying(false);
  };
  const toggle = () => (playingRef.current ? stop() : start());
  const ensureStart = () => { if (!playingRef.current) start(); };
  const setTempo = (bpm) => { tempoRef.current = bpm; if (playingRef.current) { stop(); start(); } };

  return { start, stop, toggle, ensureStart, playing, setTempo };
}

// -----------------------------
// 🎨 バリエーション定義
// -----------------------------
const VARIANTS = [
  { name: "base", wing: "flat", tail: "down", eye: "open" },
  { name: "wink", wing: "flat", tail: "down", eye: "wink" },
  { name: "flapUp", wing: "up", tail: "right", eye: "open" },
  { name: "flapDown", wing: "down", tail: "left", eye: "open" },
  { name: "scarfBlue", wing: "flat", tail: "down", eye: "open", accessory: "scarf", accessoryColor: "#60a5fa" },
  { name: "leaf", wing: "flat", tail: "right", eye: "open", accessory: "leaf", accessoryColor: "#22c55e" },
  { name: "star", wing: "up", tail: "right", eye: "open", accessory: "star", accessoryColor: "#f59e0b" },
  { name: "sleepy", wing: "flat", tail: "down", eye: "closed" },
  { name: "hat", wing: "flat", tail: "left", eye: "open", accessory: "hat", accessoryColor: "#111827" },
];

// -----------------------------
// 🐦 鳥ユニット（バリエーション/アニメ + 名札）
// -----------------------------
const Bird = ({ size = 56, i = 0, party = false, variantSeed = 0, label }) => {
  const r = (i % 7) - 3;
  const d = 0.9 + ((i * 37) % 12) / 60;
  const blink = (i + Date.now()) % 17 === 0;
  const vidx = ((i * 53 + variantSeed * 97) % VARIANTS.length + VARIANTS.length) % VARIANTS.length;
  const v = VARIANTS[vidx];
  return (
    <div className="inline-flex flex-col items-center">
      <motion.div
        className="inline-flex"
        initial={{ scale: 0.9, rotate: r }}
        animate={{ scale: party ? [1,1.3,1] : [1,d,1], rotate: party ? [r, r+6, r-6, r] : r }}
        transition={{ duration: party ? 1.2 : 0.8, repeat: party ? Infinity : 0 }}
      >
        <ShimaenagaSVG size={size} blink={blink} variant={v} />
      </motion.div>
      {label ? (
        <div className="mt-1 px-2 py-0.5 rounded-xl text-[11px] font-bold border border-amber-200 bg-amber-50 text-amber-800 shadow-sm select-none">
          {label}
        </div>
      ) : null}
    </div>
  );
};

// 鳥のグループ表示
const BirdGroup = ({ count, size = 56, label, variantSeed = 0, labelsMap }) => {
  const cols = Math.min(6, Math.max(1, Math.ceil(Math.sqrt(count))));
  const birds = Array.from({ length: count });
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(${size}px, 1fr))` }}>
        {birds.map((_, i) => (
          <Bird key={i} i={i} size={size} variantSeed={variantSeed} label={labelsMap?.[i]} />
        ))}
      </div>
      {label ? <div className="text-sm text-gray-600 font-medium">{label}</div> : null}
    </div>
  );
};

// ちいさなお祝い
const Sparkles = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div className="pointer-events-none fixed inset-0 flex items-center justify-center z-[40]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.6 }} className="rounded-2xl bg-white/80 px-6 py-3 text-lg font-bold shadow-xl">
          🎉 すごい！その調子！
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// 大きなお祝い: シンプル紙吹雪（Canvas）
const ConfettiBurst = ({ fire }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!fire) return;
    if (typeof window === "undefined") return;
    const canvas = ref.current; if (!canvas) return;
    let W = (canvas.width = window.innerWidth); let H = (canvas.height = window.innerHeight);
    const ctx = canvas.getContext("2d");
    const colors = ["#F59E0B","#10B981","#3B82F6","#EF4444","#8B5CF6","#F97316"];
    const N = 120; const parts = [];
    for (let i=0;i<N;i++) parts.push({ x: W/2+(Math.random()-0.5)*120, y: H/2, vx:(Math.random()-0.5)*6, vy:-(2+Math.random()*5), size:4+Math.random()*4, rot:Math.random()*Math.PI, vr:(Math.random()-0.5)*0.2, color: colors[(Math.random()*colors.length)|0] });
    let frames = 0; let running = true;
    const draw = () => {
      if (!running) return; ctx.clearRect(0,0,W,H);
      for (const p of parts) { p.vy += 0.12; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, 1-frames/120); ctx.fillStyle=p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); ctx.restore(); }
      frames++; if (frames<120) requestAnimationFrame(draw); else running=false;
    };
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    requestAnimationFrame(draw);
    return () => { running = false; window.removeEventListener("resize", onResize); };
  }, [fire]);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[60]" />;
};

// 大きなお祝い: 空を横切るシマエナガ隊
const PartyFlock = ({ show, variantSeed = 0 }) => {
  if (!show) return null;
  const birds = Array.from({ length: 10 });
  return (
    <div className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
      {birds.map((_, i) => (
        <motion.div key={i} className="absolute" style={{ top: `${10 + ((i * 8) % 70)}vh` }} initial={{ x: -120, rotate: -8 }} animate={{ x: "100vw", rotate: 8 }} transition={{ duration: 2 + i * 0.12, ease: "easeInOut" }}>
          <Bird i={i} size={56} party variantSeed={variantSeed} />
        </motion.div>
      ))}
    </div>
  );
};

// -----------------------------
// 🧮 出題ロジック
// -----------------------------
const OPS = {
  add: { label: "たし算", sym: "+" },
  sub: { label: "ひき算", sym: "−" },
  mul: { label: "かけ算", sym: "×" },
  div: { label: "わり算", sym: "÷" },
};

const NAME_TAGS = ["きちひさ", "いちか", "ななか"];

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function mulberry32(a){ return function(){ let t = a += 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }
function pickK(total, k, seed){ const rng = mulberry32(seed || 1); const set = new Set(); const cap = Math.min(total, k); while(set.size < cap){ set.add(Math.floor(rng()*total)); } return Array.from(set); }

function makeProblem(op, level) {
  const ranges = { easy: { min: 1, max: 9 }, mid: { min: 2, max: 12 }, hard: { min: 3, max: 20 } };
  const { min, max } = ranges[level] ?? ranges.easy;
  if (op === "add" && level === "demo") return { a: 2, b: 5, op };
  let a = getRandomInt(min, max); let b = getRandomInt(min, max);
  if (op === "sub") { if (b > a) [a, b] = [b, a]; }
  if (op === "mul") { a = getRandomInt(1, Math.min(9, max)); b = getRandomInt(1, Math.min(9, max)); }
  if (op === "div") { b = getRandomInt(1, Math.min(9, max)); const q = getRandomInt(1, Math.min(9, Math.floor(max / b))); a = b * q; }
  return { a, b, op };
}

function solve({ a, b, op }) { switch (op) { case "add": return a + b; case "sub": return a - b; case "mul": return a * b; case "div": return b === 0 ? 0 : a / b; default: return 0; } }

export default function ShimaenagaMathApp() {
  const [op, setOp] = useState("add");
  const [level, setLevel] = useState("easy");
  const [problem, setProblem] = useState(() => makeProblem("add", "demo"));
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [showParty, setShowParty] = useState(false);
  const [mega, setMega] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [variantSeed, setVariantSeed] = useState(0); // 絵柄シャッフルは自動のみ

  const [canInstall, setCanInstall] = useState(false);
  const deferredRef = useRef(null);

  const right = useMemo(() => solve(problem), [problem]);
  const sfx = useSFX();
  const bgm = useBGM(145); // ちょい速め

  // お祝い演出
  useEffect(() => {
    if (streak > 0 && streak % 3 === 0) {
      setShowParty(true); sfx.party();
      const t = setTimeout(() => setShowParty(false), 1200);
      return () => clearTimeout(t);
    }
  }, [streak]);

  // SW登録（相対パス）。HTTPS & 対応ブラウザのみ
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const isSecure = window.isSecureContext || location.protocol === "https:";
    if (!isSecure) return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }, []);

  // PWAインストールプロンプト
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBIP = (e) => { e.preventDefault(); deferredRef.current = e; setCanInstall(true); };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  // 初回ユーザー操作でBGMを開始（自動再生規制対策）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => { bgm.ensureStart(); window.removeEventListener("pointerdown", handler); window.removeEventListener("keydown", handler); };
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("pointerdown", handler); window.removeEventListener("keydown", handler); };
  }, []);

  const askInstall = async () => {
    const dp = deferredRef.current; if (!dp) return; dp.prompt(); await dp.userChoice; deferredRef.current = null; setCanInstall(false);
  };

  const next = (newOp = op, newLevel = level) => {
    const p = makeProblem(newOp, newLevel);
    setProblem(p); setAnswer(""); setResult("");
    setVariantSeed((s) => s + 1); // 問題ごとに絵柄を自動更新
  };

  const onSubmit = () => {
    if (answer === "") { setResult("？ 数字を入力してね"); sfx.error(); return; }
    const val = Number(answer);
    if (val === right) {
      setResult("◎ せいかい！"); setCorrect((c) => c + 1); setStreak((s) => s + 1); setConfetti((k) => k + 1); sfx.success(); bgm.ensureStart();
      if ((streak + 1) % 10 === 0) { setMega(true); sfx.party(); setTimeout(() => setMega(false), 2600); }
      setTimeout(() => next(op, level), 420);
    } else { setResult("× もういちど！"); setStreak(0); sfx.error(); }
  };

  // 名札の割り当て（問題ごとに3匹）
  const nameLabels = useMemo(() => {
    let total = 0;
    if (op === "add" || op === "sub") total = problem.a + problem.b;
    else if (op === "mul") total = problem.a * problem.b;
    else if (op === "div") total = problem.a;
    const idxs = pickK(total, ["きちひさ","いちか","ななか"].length, 1000 + variantSeed);
    return idxs.map((idx, i) => ({ idx, name: ["きちひさ","いちか","ななか"][i] }));
  }, [problem, op, variantSeed]);

  const OperationView = () => {
    const { a, b } = problem; const S = 54;

    if (op === "add" || op === "sub") {
      const isAdd = op === "add";
      const labelsA = {}; const labelsB = {};
      nameLabels.forEach(({ idx, name }) => {
        if (idx < a) labelsA[idx] = name; else labelsB[idx - a] = name;
      });
      return (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <BirdGroup count={a} size={S} label={`${a} ひき`} variantSeed={variantSeed} labelsMap={labelsA} />
          <div className="text-4xl md:text-5xl">{isAdd ? "+" : "−"}</div>
          <BirdGroup count={b} size={S} label={`${b} ひき`} variantSeed={variantSeed + 1} labelsMap={labelsB} />
          <div className="text-4xl md:text-5xl">＝</div>
        </div>
      );
    }

    if (op === "mul") {
      const labelMap = new Map(nameLabels.map(({ idx, name }) => [idx, name]));
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="text-base text-gray-600 mb-1">{problem.a} 行 × {problem.b} 列</div>
          <div className="flex flex-col items-center gap-1">
            {Array.from({ length: problem.a }).map((_, r) => (
              <div key={r} className="flex items-center gap-2">
                {Array.from({ length: problem.b }).map((_, c) => {
                  const flat = r * problem.b + c;
                  return (
                    <Bird key={c} i={flat} size={S} variantSeed={variantSeed + r} label={labelMap.get(flat)} />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="text-4xl md:text-5xl mt-1">＝</div>
        </div>
      );
    }

    if (op === "div") {
      const labelsA = {}; nameLabels.forEach(({ idx, name }) => { labelsA[idx] = name; });
      return (
        <div className="flex flex-col items-center gap-3">
          <BirdGroup count={problem.a} size={S} label={`${problem.a} ひき`} variantSeed={variantSeed} labelsMap={labelsA} />
          <div className="text-lg">を {problem.b} 個にわけると…</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: problem.b }).map((_, i) => (
              <div key={i} className="rounded-2xl border-2 border-dashed border-gray-300 p-2 min-w-[160px] min-h-[80px] flex items-center justify-center">
                <span className="text-sm text-gray-500">かご {i + 1}</span>
              </div>
            ))}
          </div>
          <div className="text-4xl md:text-5xl">＝</div>
        </div>
      );
    }
    return null;
  };

  const keypad = [1,2,3,4,5,6,7,8,9,0];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-50 to-white text-gray-900 flex flex-col items-center px-4 py-6">
      <Sparkles show={showParty} />
      <ConfettiBurst fire={confetti} />
      <PartyFlock show={mega} variantSeed={variantSeed} />

      <header className="w-full max-w-4xl flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">🐦 シマエナガ算数（四則）</h1>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => bgm.toggle()} className={`px-3 py-1 rounded-xl font-semibold shadow ${bgm.playing?"bg-purple-600 text-white":"bg-purple-100 hover:bg-purple-200"}`} title="BGM オン/オフ">
            ♪ BGM {bgm.playing ? "ON" : "OFF"}
          </button>
          {canInstall && (
            <button onClick={askInstall} className="px-3 py-1 rounded-xl font-semibold shadow bg-indigo-600 text-white">インストール</button>
          )}
          <div className="bg-white/80 rounded-xl px-3 py-1 shadow">連続せいかい: <b>{streak}</b></div>
          <div className="bg-white/80 rounded-xl px-3 py-1 shadow">合計せいかい: <b>{correct}</b></div>
        </div>
      </header>

      <div className="w-full max-w-4xl rounded-3xl bg-white/80 shadow-lg p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            {Object.entries(OPS).map(([k, v]) => (
              <button key={k} onClick={() => { setOp(k); next(k, level); bgm.ensureStart(); }} className={`px-3 py-1.5 rounded-xl text-sm font-semibold shadow ${op===k?"bg-sky-600 text-white":"bg-sky-100 hover:bg-sky-200"}`}>{v.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {[ ["easy","やさしい"],["mid","ふつう"],["hard","むずかしい"] ].map(([k,l]) => (
              <button key={k} onClick={() => { setLevel(k); next(op, k); bgm.ensureStart(); }} className={`px-3 py-1.5 rounded-xl text-sm font-semibold shadow ${level===k?"bg-emerald-600 text-white":"bg-emerald-100 hover:bg-emerald-200"}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {problem.op === "add" && problem.a === 2 && problem.b === 5 && (
            <div className="text-sm text-gray-600 -mb-2">はじめは 2匹 と 5匹 を たす問題の見本です（名札は3匹だけ：きちひさ・いちか・ななか）</div>
          )}

          <OperationView />

          <div className="flex items-center gap-3">
            <input className="w-28 text-center text-3xl border-2 border-gray-300 rounded-2xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-sky-200" inputMode="numeric" pattern="[0-9]*" value={answer} onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ""))} placeholder="こたえ" />
            <button onClick={onSubmit} className="px-4 py-2 rounded-2xl bg-sky-600 text-white text-lg font-bold shadow hover:bg-sky-700">こたえる</button>
            <button onClick={() => { next(op, level); bgm.ensureStart(); }} className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-800 text-lg font-semibold shadow hover:bg-gray-200">スキップ</button>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-1">
            {[1,2,3,4,5,6,7,8,9,0].map((n) => (
              <button key={n} className="rounded-xl px-3 py-2 bg-gray-100 hover:bg-gray-200 text-xl font-bold shadow" onClick={() => { bgm.ensureStart(); setAnswer((s) => { const d=String(n); if (s==="0") return n===0?"0":d; if (s==="" && n===0) return "0"; return s + d; }); }}>{n}</button>
            ))}
            <button className="rounded-xl px-3 py-2 bg-rose-100 hover:bg-rose-200 text-base font-semibold shadow col-span-2" onClick={() => setAnswer((s) => s.slice(0, -1))}>← けす</button>
            <button className="rounded-xl px-3 py-2 bg-emerald-200 hover:bg-emerald-300 text-base font-bold shadow col-span-3" onClick={onSubmit}>OK</button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div key={result} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className={`text-xl font-bold ${result.includes("◎")?"text-emerald-600":"text-rose-600"}`}>{result}</motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 max-w-3xl text-center">
        正解が続くとシマエナガが大はしゃぎ＆紙吹雪！ 絵柄は各問題で自動的に変わります。名札はいつも3匹だけ（きちひさ・いちか・ななか）。PWAはHTTPS環境でインストールできます。
      </div>
    </div>
  );
}
