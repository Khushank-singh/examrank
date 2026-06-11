import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";

function getRankTier(rank) {
  if (rank <= 100)   return { label:"Top 100 🏆", color:"#f59e0b" };
  if (rank <= 1000)  return { label:"Top 1K 🔥",  color:"#f97316" };
  if (rank <= 10000) return { label:"Top 10K ⭐", color:"#eab308" };
  if (rank <= 50000) return { label:"Top 50K 👍", color:"#10b981" };
  return               { label:"Keep Going 💪", color:"#8b5cf6" };
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background:"rgba(7,7,26,.96)", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, padding:"8px 12px", fontFamily:"'Sora',sans-serif" }}>
      <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginBottom:3 }}>Rank</div>
      <div style={{ fontSize:13, color:"white", fontWeight:700 }}>#{payload[0].value?.toLocaleString()}</div>
    </div>
  );
}

export default function History({ refresh }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem("token");

  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [filter,      setFilter]      = useState("ALL");
  const [search,      setSearch]      = useState("");
  const [focused,     setFocused]     = useState(false);
  const [clearing,    setClearing]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchHistory = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/history`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setError("Failed to load history");
      }
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token, refresh]);

  async function clearHistory() {
    setClearing(true);
    try {
      const res = await fetch(`${API_URL}/history`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        setHistory([]);
        setShowConfirm(false);
      } else {
        setError("Failed to clear history");
      }
    } catch {
      setError("Server error");
    } finally {
      setClearing(false);
    }
  }

  // server returns: id, stream, total, predicted_rank, percentile, confidence, created_at
  const filtered = history.filter(item => {
    const examType = item.stream === "PCB" ? "NEET" : "JEE";
    if (filter !== "ALL" && examType !== filter) return false;
    if (!search) return true;
    return (
      examType.toLowerCase().includes(search.toLowerCase()) ||
      String(item.predicted_rank ?? "").includes(search) ||
      String(item.total ?? "").includes(search)
    );
  });

  const bestRank = history.length > 0
    ? Math.min(...history.map(h => h.predicted_rank ?? Infinity))
    : null;

  const avgPercentile = history.length > 0
    ? (history.reduce((s, h) => s + Number(h.percentile ?? 0), 0) / history.length).toFixed(1)
    : null;

  const latestPrediction = history.length > 0 ? history[0] : null;

  // chart shows rank trend (oldest → newest, reversed since DB returns DESC)
  const chartData = history.slice().reverse().slice(-10).map(item => ({
    rank:       item.predicted_rank ?? 0,
    percentile: Number(item.percentile ?? 0),
  }));

  const q = search.trim().toLowerCase();

  function highlight(text) {
    if (!q || text == null) return String(text ?? "");
    const s = String(text);
    const i = s.toLowerCase().indexOf(q);
    if (i === -1) return s;
    return (
      <span>
        {s.slice(0, i)}
        <mark style={{ background:"rgba(249,115,22,.35)", color:"white", borderRadius:2, padding:"0 2px" }}>
          {s.slice(i, i + q.length)}
        </mark>
        {s.slice(i + q.length)}
      </span>
    );
  }

  if (!token) return <p style={{ color:"white", fontFamily:"'Sora',sans-serif" }}>Please login.</p>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem", fontFamily:"'Sora',sans-serif" }}>

      <style>{`@keyframes shimmer { from{opacity:.3} to{opacity:.65} }`}</style>

      {/* page heading + clear button */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div>
          <h2 style={{ fontSize:"1.4rem", fontWeight:800, color:"white", marginBottom:4 }}>
            Prediction{" "}
            <span style={{ background:"linear-gradient(135deg,#f97316,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              History
            </span>
          </h2>
          <p style={{ fontSize:".78rem", color:"rgba(255,255,255,.35)" }}>
            Showing last {history.length} of up to 50 predictions
          </p>
        </div>

        {/* clear history */}
        {history.length > 0 && !showConfirm && (
          <button onClick={() => setShowConfirm(true)}
            style={{ padding:"7px 16px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.25)", borderRadius:9, color:"#fca5a5", fontFamily:"'Sora',sans-serif", fontSize:".78rem", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all .2s", flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Clear History
          </button>
        )}

        {/* confirmation row */}
        {showConfirm && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.28)", borderRadius:10 }}>
            <span style={{ fontSize:".78rem", color:"#fca5a5" }}>Delete all predictions?</span>
            <button onClick={clearHistory} disabled={clearing}
              style={{ padding:"4px 12px", background:"rgba(239,68,68,.7)", border:"none", borderRadius:7, color:"white", fontFamily:"'Sora',sans-serif", fontSize:".75rem", fontWeight:700, cursor:clearing?"not-allowed":"pointer" }}>
              {clearing ? "Clearing…" : "Yes, delete"}
            </button>
            <button onClick={() => setShowConfirm(false)}
              style={{ padding:"4px 12px", background:"rgba(255,255,255,.08)", border:"none", borderRadius:7, color:"rgba(255,255,255,.6)", fontFamily:"'Sora',sans-serif", fontSize:".75rem", cursor:"pointer" }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* summary stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
        {[
          { label:"Attempts",       value: String(history.length),                                              color:"#06b6d4", icon:"🎯" },
          { label:"Best Rank",      value: bestRank && bestRank !== Infinity ? "#"+bestRank.toLocaleString() : "--", color:"#f59e0b", icon:"🏆" },
          { label:"Avg Percentile", value: avgPercentile ? avgPercentile+"%" : "--",                            color:"#10b981", icon:"📊" },
          { label:"Predictions",    value: String(history.length),                                              color:"#a78bfa", icon:"🔮" },
          { label:"Latest Rank",    value: latestPrediction ? "#"+Number(latestPrediction.predicted_rank).toLocaleString() : "--", color:"#f97316", icon:"⚡" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:13, padding:"11px 12px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:8, right:9, fontSize:".9rem", opacity:.13 }}>{s.icon}</div>
            <div style={{ fontSize:".58rem", color:"rgba(255,255,255,.34)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:"1.05rem", fontWeight:800, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* rank trend chart */}
      {history.length > 1 && (
        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:"14px 16px" }}>
          <div style={{ fontSize:".78rem", fontWeight:700, color:"white", marginBottom:2 }}>📈 Rank Trend</div>
          <div style={{ fontSize:".63rem", color:"rgba(255,255,255,.3)", marginBottom:12 }}>
            Last {chartData.length} predictions — lower is better
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis hide />
              <YAxis
                reversed
                stroke="rgba(255,255,255,.15)"
                tick={{ fill:"rgba(255,255,255,.3)", fontSize:10, fontFamily:"'Sora',sans-serif" }}
                tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}K` : v}
                width={38}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone" dataKey="rank"
                stroke="#06b6d4" strokeWidth={2.5}
                dot={{ fill:"#06b6d4", r:3, strokeWidth:0 }}
                activeDot={{ r:5, fill:"#f97316", strokeWidth:0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* search + filter */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:180, display:"flex", alignItems:"center", gap:8, padding:"0 11px", height:38,
          background:"rgba(255,255,255,.05)",
          border:`1px solid ${focused ? "rgba(249,115,22,.5)" : "rgba(255,255,255,.1)"}`,
          borderRadius:10,
          boxShadow: focused ? "0 0 0 3px rgba(249,115,22,.1)" : "none",
          transition:"all .2s" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={focused ? "rgba(249,115,22,.7)" : "rgba(255,255,255,.26)"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search rank, marks, exam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"white", fontFamily:"'Sora',sans-serif", fontSize:".8rem" }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:".72rem", lineHeight:1 }}>✕</button>
          )}
        </div>

        <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:3 }}>
          {[["ALL","All"],["JEE","⚛️ JEE"],["NEET","🧬 NEET"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding:"5px 13px", borderRadius:7, border:"none", fontFamily:"'Sora',sans-serif", fontSize:".75rem", fontWeight:600, cursor:"pointer", transition:"all .18s",
                background: filter === val
                  ? val === "JEE"  ? "linear-gradient(135deg,#3b82f6,#8b5cf6)"
                  : val === "NEET" ? "linear-gradient(135deg,#10b981,#06b6d4)"
                  :                  "linear-gradient(135deg,#f97316,#ec4899)"
                  : "transparent",
                color:     filter === val ? "white" : "rgba(255,255,255,.38)",
                boxShadow: filter === val ? "0 3px 10px rgba(0,0,0,.3)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {q && (
        <p style={{ fontSize:".72rem", color:"rgba(255,255,255,.3)", marginTop:"-0.5rem" }}>
          {filtered.length === 0
            ? `No results for "${search}"`
            : `${filtered.length} result${filtered.length > 1 ? "s" : ""} for "${search}"`}
        </p>
      )}

      {/* list */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height:110, background:"rgba(255,255,255,.04)", borderRadius:14, animation:"shimmer 1.4s ease-in-out infinite alternate" }} />
          ))}
        </div>

      ) : error ? (
        <div style={{ padding:"10px 14px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.22)", borderRadius:10, color:"#fca5a5", fontSize:".8rem", display:"flex", alignItems:"center", gap:8 }}>
          ⚠️ {error}
        </div>

      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"2.5rem 2rem", background:"rgba(255,255,255,.02)", border:"1px dashed rgba(255,255,255,.09)", borderRadius:16 }}>
          <div style={{ fontSize:"2.2rem", marginBottom:8, opacity:.3 }}>{q ? "🔍" : "📭"}</div>
          <div style={{ fontSize:".9rem", color:"rgba(255,255,255,.45)", fontWeight:600, marginBottom:5 }}>
            {q ? "No matches found" : "No predictions yet"}
          </div>
          <p style={{ fontSize:".75rem", color:"rgba(255,255,255,.25)" }}>
            {q ? "Try a different search term" : "Make your first prediction to see it here"}
          </p>
          {q && (
            <button onClick={() => setSearch("")}
              style={{ marginTop:"1rem", padding:"6px 16px", background:"rgba(249,115,22,.1)", border:"1px solid rgba(249,115,22,.28)", borderRadius:8, color:"#f97316", fontFamily:"'Sora',sans-serif", fontSize:".75rem", cursor:"pointer" }}>
              Clear search
            </button>
          )}
        </div>

      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <AnimatePresence>
            {filtered.map((item, idx) => {
              // stream column now returned from server
              const examType = item.stream === "PCB" ? "NEET" : "JEE";
              const rank     = item.predicted_rank ?? 0;
              const tier     = getRankTier(rank);
              const isJEE    = examType === "JEE";
              const grad     = isJEE
                ? "linear-gradient(135deg,#3b82f6,#8b5cf6)"
                : "linear-gradient(135deg,#10b981,#06b6d4)";
              const dateStr  = item.created_at
                ? new Date(item.created_at).toLocaleString()
                : "";

              return (
                <motion.div key={item.id ?? idx}
                  initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, scale:.96 }} transition={{ delay: idx * 0.03 }}
                  style={{ display:"flex", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, overflow:"hidden", transition:"border-color .2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"}
                >
                  <div style={{ width:4, flexShrink:0, background:grad }} />

                  <div style={{ flex:1, padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:".92rem" }}>{isJEE ? "⚛️" : "🧬"}</span>
                        <span style={{ fontSize:".88rem", fontWeight:700, background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                          {highlight(examType)}
                        </span>
                        <span style={{ fontSize:".66rem", padding:"2px 8px", borderRadius:20, border:`1px solid ${tier.color}44`, background:`${tier.color}12`, color:tier.color, fontWeight:500 }}>
                          {tier.label}
                        </span>
                      </div>
                      <span style={{ fontSize:".68rem", color:"rgba(255,255,255,.25)" }}>{dateStr}</span>
                    </div>

                    {/* metrics — using exact DB column names: total, predicted_rank, percentile, confidence */}
                    <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", marginBottom:10 }}>
                      {[
                        { label:"Marks",      value: item.total       != null ? highlight(String(item.total))                      : "—", color:"white"   },
                        { label:"Rank",       value: item.predicted_rank != null ? highlight("#"+Number(item.predicted_rank).toLocaleString()) : "—", color:"#f59e0b" },
                        { label:"Percentile", value: item.percentile  != null ? `${item.percentile}%`                            : "—", color:"#10b981" },
                        { label:"Confidence", value: item.confidence  != null ? `${item.confidence}%`                            : "—", color:"#a78bfa" },
                      ].map((m, i) => (
                        <div key={m.label} style={{ display:"flex", alignItems:"center" }}>
                          {i > 0 && <div style={{ width:1, height:26, background:"rgba(255,255,255,.07)", margin:"0 12px" }} />}
                          <div>
                            <div style={{ fontSize:".58rem", color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>{m.label}</div>
                            <div style={{ fontSize:".9rem", fontWeight:700, color:m.color }}>{m.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:".62rem", color:"rgba(255,255,255,.26)", whiteSpace:"nowrap" }}>Confidence</span>
                      <div style={{ flex:1, height:3, background:"rgba(255,255,255,.07)", borderRadius:2, overflow:"hidden" }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width:`${item.confidence ?? 0}%` }}
                          transition={{ duration:.6, delay: idx * 0.03 + 0.1 }}
                          style={{ height:"100%", borderRadius:2, background:grad }}
                        />
                      </div>
                      <span style={{ fontSize:".62rem", color:"rgba(255,255,255,.3)", minWidth:26, textAlign:"right" }}>
                        {item.confidence ?? "—"}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
