import React, { useState, useEffect, useCallback } from "react";

/* ==========================================================================
   Modèle du Réseau de Petri (identique à la version originale)
   ========================================================================== */
const PLACES = ["Ra", "Re", "Oa", "Oe", "Va", "Ve"];

const NET = {
  T_RO: { pre: { Ra: 1, Oe: 1 }, post: { Re: 1, Oa: 1 } },
  T_OV: { pre: { Oa: 1, Ve: 1 }, post: { Oe: 1, Va: 1 } },
  T_VO: { pre: { Va: 1, Oe: 1 }, post: { Ve: 1, Oa: 1 } },
  T_OR: { pre: { Oa: 1, Re: 1 }, post: { Oe: 1, Ra: 1 } },
};

const TRANSITIONS = Object.keys(NET);
const INITIAL_MARKING = { Ra: 1, Re: 0, Oa: 0, Oe: 1, Va: 0, Ve: 1 };
const AUTO_SEQUENCE = ["T_RO", "T_OV", "T_VO", "T_OR"];

const LAYOUT = {
  T_OR: { x: 250, y: 90 }, Ra: { x: 250, y: 180 }, T_RO: { x: 250, y: 270 }, Re: { x: 250, y: 360 },
  Oa: { x: 440, y: 420 }, Oe: { x: 580, y: 420 }, T_OV: { x: 250, y: 480 }, Va: { x: 250, y: 570 },
  T_VO: { x: 250, y: 660 }, Ve: { x: 250, y: 750 },
};

const ARCS = [
  { from: "T_OR", to: "Ra", bend: 0 }, { from: "Ra", to: "T_RO", bend: 0 },
  { from: "T_RO", to: "Re", bend: 0 }, { from: "T_OV", to: "Va", bend: 0 },
  { from: "Va", to: "T_VO", bend: 0 }, { from: "T_VO", to: "Ve", bend: 0 },
  { from: "Re", to: "T_OR", bend: -220 }, { from: "Ve", to: "T_OV", bend: -220 },
  { from: "T_OR", to: "Oe", bend: -170 }, { from: "Oa", to: "T_OR", bend: 0 },
  { from: "Oe", to: "T_RO", bend: 0 }, { from: "T_RO", to: "Oa", bend: 50 },
  { from: "Oa", to: "T_OV", bend: 0 }, { from: "T_OV", to: "Oe", bend: 110 },
  { from: "Oe", to: "T_VO", bend: 0 }, { from: "T_VO", to: "Oa", bend: 80 },
];

const R = 26, TW = 16, TH = 52;

function isPlace(id) {
  return !/^T/.test(id);
}

function edgePoint(node, dx, dy, place) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  if (place) return { x: node.x + ux * R, y: node.y + uy * R };
  const hw = TW / 2, hh = TH / 2;
  const tx = Math.abs(ux) > 1e-6 ? hw / Math.abs(ux) : Infinity;
  const ty = Math.abs(uy) > 1e-6 ? hh / Math.abs(uy) : Infinity;
  const t = Math.min(tx, ty);
  return { x: node.x + ux * t, y: node.y + uy * t };
}

function pathFor(a) {
  const from = LAYOUT[a.from], to = LAYOUT[a.to];
  const dx = to.x - from.x, dy = to.y - from.y;
  const p1 = edgePoint(from, dx, dy, isPlace(a.from));
  const p2 = edgePoint(to, -dx, -dy, isPlace(a.to));
  const bend = a.bend || 0;
  if (bend === 0) return `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
  const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const ctrlx = mx + nx * bend * 0.6;
  const ctrly = my + ny * bend * 0.6;
  return `M${p1.x},${p1.y} Q${ctrlx},${ctrly} ${p2.x},${p2.y}`;
}

function isEnabled(marking, t) {
  const pre = NET[t].pre;
  return Object.keys(pre).every((p) => marking[p] >= pre[p]);
}

function enabledSet(marking) {
  return TRANSITIONS.filter((t) => isEnabled(marking, t));
}

function fireTransition(marking, seqIndex, t) {
  if (!isEnabled(marking, t)) return null;
  const { pre, post } = NET[t];
  const next = { ...marking };
  Object.keys(pre).forEach((p) => (next[p] -= pre[p]));
  Object.keys(post).forEach((p) => (next[p] += post[p]));
  const idx = AUTO_SEQUENCE.indexOf(t);
  const nextSeqIndex = idx >= 0 ? (idx + 1) % AUTO_SEQUENCE.length : seqIndex;
  return { marking: next, seqIndex: nextSeqIndex };
}

function conflictSet(marking) {
  const enabled = enabledSet(marking);
  const conflicting = new Set();
  enabled.forEach((t1) => {
    enabled.forEach((t2) => {
      if (t1 >= t2) return;
      if (Object.keys(NET[t1].pre).some((p) => NET[t2].pre[p])) {
        conflicting.add(t1);
        conflicting.add(t2);
      }
    });
  });
  return conflicting;
}

/* ==========================================================================
   Composant principal
   ========================================================================== */
export default function PetriNetSimulator() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("petri-theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const [sim, setSim] = useState({
    marking: { ...INITIAL_MARKING },
    seqIndex: 0,
    historyLog: [],
  });
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [activeTab, setActiveTab] = useState("pre");

  useEffect(() => {
    try {
      localStorage.setItem("petri-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const step = useCallback(() => {
    setSim((prev) => {
      const candidate = AUTO_SEQUENCE[prev.seqIndex];
      const t = isEnabled(prev.marking, candidate) ? candidate : enabledSet(prev.marking)[0];
      if (!t) return prev;
      const result = fireTransition(prev.marking, prev.seqIndex, t);
      if (!result) return prev;
      return {
        marking: result.marking,
        seqIndex: result.seqIndex,
        historyLog: [...prev.historyLog, t],
      };
    });
  }, []);

  const manualFire = useCallback((t) => {
    setSim((prev) => {
      const result = fireTransition(prev.marking, prev.seqIndex, t);
      if (!result) return prev;
      return {
        marking: result.marking,
        seqIndex: result.seqIndex,
        historyLog: [...prev.historyLog, t],
      };
    });
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    setSim({ marking: { ...INITIAL_MARKING }, seqIndex: 0, historyLog: [] });
  }, []);

  // Boucle de lecture automatique (remplace le setTimeout récursif original)
  useEffect(() => {
    if (!playing) return undefined;
    const delay = 2000 - speed + 500; // même formule que l'original: max - value + min
    const timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [playing, speed, sim, step]);

  const { marking, historyLog } = sim;
  const enabled = new Set(enabledSet(marking));
  const conflicting = conflictSet(marking);

  return (
    <div className="petri-app" data-theme={theme}>
      <style>{STYLES}</style>

      <div className="wrap">
        <header>
          <div className="header-top">
            <p className="kicker">RÉSEAUX DE PETRI</p>
            <button
              className="theme-toggle"
              aria-label="Toggle theme"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
          <h1>Simulation Feu tri-color</h1>
        </header>

        <div className="layout">
          {/* Panneau de gauche : Graphe visuel */}
          <div>
            <div className="panel">
              <h2>Graphe du réseau</h2>
              <svg id="graphSvg" viewBox="0 0 700 820" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6.5"
                    markerHeight="6.5"
                    orient="auto-start-reverse"
                  >
                    <path className="arrow-head" d="M0,0 L10,5 L0,10 z" />
                  </marker>
                </defs>
                <g>
                  {ARCS.map((a, i) => (
                    <path key={i} d={pathFor(a)} className="arc" markerEnd="url(#arrow)" />
                  ))}
                </g>
                <g>
                  {PLACES.map((p) => {
                    const { x, y } = LAYOUT[p];
                    const offsetLabel = p === "Oa" || p === "Oe";
                    return (
                      <g key={p}>
                        <circle cx={x} cy={y} r={R} className="place-circle" />
                        {marking[p] > 0 && <circle cx={x} cy={y} r={7} className="token" />}
                        <text
                          x={x + (offsetLabel ? R + 10 : 0)}
                          y={offsetLabel ? y + 5 : y - R - 10}
                          textAnchor={offsetLabel ? "start" : "middle"}
                          className="place-label"
                        >
                          {p}
                        </text>
                      </g>
                    );
                  })}
                  {TRANSITIONS.map((t) => {
                    const { x, y } = LAYOUT[t];
                    let cls = "trans-bar";
                    if (enabled.has(t)) cls += " enabled";
                    if (conflicting.has(t)) cls += " conflict";
                    return (
                      <g key={t}>
                        <rect
                          x={x - TW / 2}
                          y={y - TH / 2}
                          width={TW}
                          height={TH}
                          rx={4}
                          className={cls}
                          onClick={() => manualFire(t)}
                        />
                        <text x={x - TW / 2 - 10} y={y + 4} textAnchor="end" className="trans-label">
                          {t}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
              <p className="hint">
                Les transitions actives sont en{" "}
                <span style={{ color: "var(--green)", fontWeight: 600 }}>Vert</span>. Celles en{" "}
                <span style={{ color: "var(--conflict)", fontWeight: 600 }}>Violet</span> indiquent un conflit.
                Cliquez pour franchir.
              </p>
            </div>

            <div className="panel" style={{ marginTop: 24 }}>
              <h2>Rendu Physique</h2>
              <div className="carrefour">
                <div className="feu">
                  <div className={`lamp r${marking.Ra > 0 ? " lit" : ""}`} />
                  <div className={`lamp o${marking.Oa > 0 ? " lit" : ""}`} />
                  <div className={`lamp v${marking.Va > 0 ? " lit" : ""}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Panneau de droite : Contrôles et Données */}
          <div>
            <div className="panel">
              <h2>Contrôles</h2>
              <div className="controls">
                <button className="primary" onClick={() => setPlaying((p) => !p)}>
                  {playing ? "⏸ Pause" : "▶ Lecture"}
                </button>
                <button onClick={step}>Pas à pas</button>
                <button onClick={reset}>Reset</button>
                <div className="speed-row">
                  <span>Vitesse</span>
                  <input
                    type="range"
                    min={500}
                    max={2000}
                    step={100}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  />
                </div>
              </div>

              <h2 style={{ marginTop: 32 }}>Marquage (M)</h2>
              <div className="marking-grid">
                {PLACES.map((p) => (
                  <div key={p} className={`mk-cell${marking[p] > 0 ? " hot" : ""}`}>
                    <span className="p">{p}</span>
                    <span className="v">{marking[p]}</span>
                  </div>
                ))}
              </div>

              <h2 style={{ marginTop: 32 }}>Matrices</h2>
              <div className="tabs">
                <div
                  className={`tab${activeTab === "pre" ? " active" : ""}`}
                  onClick={() => setActiveTab("pre")}
                >
                  Pré (W-)
                </div>
                <div
                  className={`tab${activeTab === "post" ? " active" : ""}`}
                  onClick={() => setActiveTab("post")}
                >
                  Post (W+)
                </div>
              </div>
              <div className="table-responsive">
                <table className="matrix">
                  <tbody>
                    <tr>
                      <th>P\T</th>
                      {TRANSITIONS.map((t) => (
                        <th key={t}>{t.replace("T_", "")}</th>
                      ))}
                    </tr>
                    {PLACES.map((p) => (
                      <tr key={p}>
                        <th>{p}</th>
                        {TRANSITIONS.map((t) => {
                          const val = NET[t][activeTab][p] || 0;
                          return (
                            <td key={t} className={val ? "nz" : ""}>
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 style={{ marginTop: 32 }}>Historique</h2>
              <div className="log">
                {historyLog.length === 0 ? (
                  <em>En attente de franchissement...</em>
                ) : (
                  historyLog.map((t, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && " → "}
                      <span>{t.replace("T_", "")}</span>
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <footer>Modèle : R = (P,T,Pre,Post) · M(Pi) ≥ Pre(Pi,Tj)</footer>
      </div>
    </div>
  );
}

/* ==========================================================================
   Styles (identiques à la version HTML originale, scopés à .petri-app)
   ========================================================================== */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.petri-app {
  --bg-body: #f3f4f6;
  --bg-panel: #ffffff;
  --bg-panel-hover: #f9fafb;
  --text-main: #111827;
  --text-muted: #6b7280;
  --border: #e5e7eb;

  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --primary-text: #ffffff;

  --amber: #f59e0b;
  --red: #ef4444;
  --orange: #f97316;
  --green: #10b981;
  --conflict: #d946ef;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --dot-color: rgba(0, 0, 0, 0.05);

  background-color: var(--bg-body);
  background-image: radial-gradient(var(--dot-color) 1px, transparent 1px);
  background-size: 20px 20px;
  color: var(--text-main);
  font-family: 'Space Grotesk', sans-serif;
  min-height: 100vh;
  padding: 2rem 1.5rem;
}

.petri-app[data-theme="dark"] {
  --bg-body: #0f172a;
  --bg-panel: #1e293b;
  --bg-panel-hover: #334155;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border: #334155;

  --primary: #6366f1;
  --primary-hover: #818cf8;
  --primary-text: #ffffff;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  --dot-color: rgba(255, 255, 255, 0.05);
}

.petri-app * { box-sizing: border-box; transition: background-color 0.3s ease, border-color 0.3s ease; }

.wrap { max-width: 1200px; margin: 0 auto; }

.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.kicker { font-family: 'IBM Plex Mono', monospace; font-size: 13px; letter-spacing: 0.05em; color: var(--primary); margin: 0; font-weight: 600; }
h1 { font-size: clamp(24px, 4vw, 36px); font-weight: 700; margin: 0 0 12px; line-height: 1.2; color: var(--text-main); }
header p { max-width: 800px; color: var(--text-muted); font-size: 16px; line-height: 1.6; margin: 0 0 16px; }

.theme-toggle {
  background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main);
  width: 44px; height: 44px; border-radius: 50%; cursor: pointer;
  display: flex; justify-content: center; align-items: center; font-size: 20px;
  box-shadow: var(--shadow-sm); transition: all 0.2s ease;
}
.theme-toggle:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.theme-toggle:active { transform: translateY(0); }

.layout { display: grid; grid-template-columns: 1fr; gap: 24px; margin-top: 32px; }
@media (min-width: 1024px) { .layout { grid-template-columns: 1.4fr 1fr; } }

.panel { background: var(--bg-panel); border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: var(--shadow-md); }
.panel h2 {
  font-size: 15px; color: var(--text-main); margin: 0 0 20px; font-weight: 700;
  display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 0.05em;
}
.panel h2::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--primary); display: inline-block; }

#graphSvg { width: 100%; height: auto; display: block; max-height: 820px; margin: 0 auto; }
.place-circle { fill: var(--bg-body); stroke: var(--text-muted); stroke-width: 2.5; transition: stroke 0.3s, fill 0.3s; }
.place-label { fill: var(--text-main); font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; transition: fill 0.3s; }
.token { fill: var(--amber); }

.trans-bar { fill: var(--bg-body); stroke: var(--text-muted); stroke-width: 2; cursor: default; transition: all 0.25s; }
.trans-bar.enabled { fill: rgba(16, 185, 129, 0.1); stroke: var(--green); cursor: pointer; filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.4)); }
.trans-bar.conflict { stroke: var(--conflict); filter: drop-shadow(0 0 6px rgba(217, 70, 239, 0.4)); fill: rgba(217, 70, 239, 0.1); }
.trans-label { fill: var(--text-muted); font-family: 'IBM Plex Mono', monospace; font-size: 11px; pointer-events: none; transition: fill 0.3s; }

.arc { stroke: var(--text-muted); stroke-width: 1.5; fill: none; transition: stroke 0.3s; }
.arrow-head { fill: var(--text-muted); transition: fill 0.3s; }

.hint { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-top: 16px; text-align: center; }

.controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 24px; }
.petri-app button {
  font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 600;
  border: 1px solid var(--border); background: var(--bg-body); color: var(--text-main);
  padding: 10px 18px; border-radius: 8px; cursor: pointer; box-shadow: var(--shadow-sm); transition: all 0.2s ease;
}
.petri-app button:hover { border-color: var(--text-muted); background: var(--bg-panel-hover); transform: translateY(-1px); }
.petri-app button:active { transform: translateY(1px); }
.petri-app button.primary { background: var(--primary); color: var(--primary-text); border-color: var(--primary); }
.petri-app button.primary:hover { background: var(--primary-hover); }

.speed-row { display: flex; align-items: center; gap: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--text-muted); margin-left: auto; }
.petri-app input[type=range] { accent-color: var(--primary); width: 100px; cursor: pointer; }

.carrefour { display: flex; justify-content: center; padding: 10px; }
.feu {
  display: flex; flex-direction: column; gap: 12px; background: #111827; border: 2px solid #374151;
  border-radius: 16px; padding: 16px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 10px 15px -3px rgba(0,0,0,0.3);
}
.lamp { width: 36px; height: 36px; border-radius: 50%; background: #1f2937; opacity: 0.2; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: inset 0 4px 6px rgba(0,0,0,0.4); }
.lamp.lit { opacity: 1; }
.lamp.r.lit { background: var(--red); box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(255,255,255,0.4); }
.lamp.o.lit { background: var(--orange); box-shadow: 0 0 20px 4px rgba(249, 115, 22, 0.6), inset 0 0 10px rgba(255,255,255,0.4); }
.lamp.v.lit { background: var(--green); box-shadow: 0 0 20px 4px rgba(16, 185, 129, 0.6), inset 0 0 10px rgba(255,255,255,0.4); }

.marking-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; text-align: center; margin-bottom: 24px; }
@media (min-width: 480px) { .marking-grid { grid-template-columns: repeat(6, 1fr); } }
.mk-cell { background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 10px 4px; transition: all 0.3s ease; }
.mk-cell .p { color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 4px; font-weight: 500; }
.mk-cell .v { font-size: 16px; font-weight: 700; color: var(--text-main); }
.mk-cell.hot { border-color: var(--amber); background: rgba(245, 158, 11, 0.05); }
.mk-cell.hot .v { color: var(--amber); }

.table-responsive { width: 100%; overflow-x: auto; margin-bottom: 12px; }
.petri-app table.matrix { border-collapse: separate; border-spacing: 0; width: 100%; font-family: 'IBM Plex Mono', monospace; font-size: 12px; min-width: 400px; }
.petri-app table.matrix th, .petri-app table.matrix td { border-bottom: 1px solid var(--border); text-align: center; padding: 10px; color: var(--text-muted); }
.petri-app table.matrix th { color: var(--text-main); font-weight: 600; background: var(--bg-body); }
.petri-app table.matrix tr th:first-child { border-right: 1px solid var(--border); }
.petri-app table.matrix td.nz { color: var(--text-main); font-weight: 700; }
.petri-app table.matrix tr:last-child td, .petri-app table.matrix tr:last-child th { border-bottom: none; }

.tabs { display: flex; gap: 8px; margin-bottom: 14px; }
.tab { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 20px; cursor: pointer; background: var(--bg-body); color: var(--text-muted); border: 1px solid transparent; }
.tab.active { background: var(--primary); color: var(--primary-text); box-shadow: var(--shadow-sm); }
.tab:hover:not(.active) { background: var(--border); }

.log { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); max-height: 120px; overflow-y: auto; line-height: 1.8; background: var(--bg-body); padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border); margin-top: 20px; }
.log span { color: var(--primary); font-weight: 600; }

footer { margin-top: 32px; font-size: 13px; color: var(--text-muted); text-align: center; font-family: 'IBM Plex Mono', monospace; }
`;
