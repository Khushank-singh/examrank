import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import History from "./History";
import Auth from "./Auth";
import RankChart from "./RankChart";

function getRankBadge(rank) {
  if (rank <= 100)   return { title:"🏆 Top 100",       color:"text-yellow-400", bg:"bg-yellow-500/10 border-yellow-500/30" };
  if (rank <= 1000)  return { title:"🔥 Top 1K",        color:"text-orange-400", bg:"bg-orange-500/10 border-orange-500/30" };
  if (rank <= 10000) return { title:"⭐ Top 10K",        color:"text-cyan-400",   bg:"bg-cyan-500/10 border-cyan-500/30"    };
  if (rank <= 50000) return { title:"💪 Top 50K",        color:"text-green-400",  bg:"bg-green-500/10 border-green-500/30"  };
  return               { title:"🚀 Keep Improving",  color:"text-purple-400", bg:"bg-purple-500/10 border-purple-500/30" };
}

function getMotivation(rank, stream) {
  const jee = stream === "PCM";
  if (rank <= 100)   return { emoji:"🏆", tier:"LEGENDARY", headline: jee?"Top 100 — IIT Bombay CSE Awaits!":"Top 100 — AIIMS Delhi Awaits!",         body: jee?"IIT Bombay CSE closes ~AIR 50. Every IIT branch is yours.":"AIIMS Delhi closes under AIR 50. The pinnacle of Indian medical education.", color:"#f59e0b", glow:"rgba(245,158,11,.15)"  };
  if (rank <= 1000)  return { emoji:"🚀", tier:"ELITE",     headline: jee?"Top 1K — IITs Are Yours!":"Top 1K — All AIIMS Open!",                       body: jee?"IIT Delhi, Kanpur, Madras within reach. Less than 0.1% reach this tier.":"AIIMS Bhopal, Patna, Rishikesh close before rank 1000.", color:"#a78bfa", glow:"rgba(167,139,250,.15)" };
  if (rank <= 10000) return { emoji:"🌟", tier:"GREAT",     headline: jee?"Top 10K — NITs & BITS!":"Top 10K — Govt MBBS Confirmed!",                   body: jee?"NIT Trichy, Warangal, BITS Pilani are realistic. Top 1% of JEE aspirants.":"Govt MBBS virtually confirmed. Top state medical colleges open.", color:"#10b981", glow:"rgba(16,185,129,.15)"  };
  if (rank <= 50000) return { emoji:"👍", tier:"GOOD",      headline: jee?"Top 50K — Good Colleges Await!":"Top 50K — Private MBBS & BDS!",            body: jee?"State NITs and strong private colleges open. 20 more marks → top 10K.":"State govt seats and top private medical colleges accessible.", color:"#3b82f6", glow:"rgba(59,130,246,.15)"  };
  return               { emoji:"💪", tier:"RISING",    headline:"Every Topper Started Here. Keep Going.",                                              body: jee?"~60 more marks to top 10K. Master NCERT and previous year papers.":"~50 more marks to top 50K. NCERT Biology is 70% of your NEET.", color:"#f97316", glow:"rgba(249,115,22,.15)"  };
}

const SUBJECT_MAX = {
  PCM: { physics:100, chemistry:100, maths:100,  biology:0   },
  PCB: { physics:180, chemistry:180, maths:0,    biology:360 },
};
const TOTAL_MAX = { PCM:300, PCB:720 };

function cap(value, max) {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0) return "";
  return String(Math.min(n, max));
}

export default function App() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem("token");

  const [stream,    setStream]    = useState("PCM");
  const [physics,   setPhysics]   = useState("");
  const [chemistry, setChemistry] = useState("");
  const [maths,     setMaths]     = useState("");
  const [biology,   setBiology]   = useState("");

  const [rank,       setRank]       = useState(null);
  const [percentile, setPercentile] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [totalMarks, setTotalMarks] = useState(null);

  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [refreshHistory, setRefreshHistory] = useState(false);
  const [activeTab,      setActiveTab]      = useState("predict");

  function logout() {
    localStorage.removeItem("token");
    window.location.reload();
  }

  async function predictRank() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const payload = {
        physics:   Number(physics)   || 0,
        chemistry: Number(chemistry) || 0,
        maths:     stream === "PCM" ? Number(maths)   || 0 : 0,
        biology:   stream === "PCB" ? Number(biology) || 0 : 0,
        stream,
      };
      const res  = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:"Bearer "+token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Prediction failed"); return; }
      setRank(data.predicted_rank);
      setPercentile(data.percentile);
      setConfidence(data.confidence);
      setTotalMarks(data.total_marks);
      setRefreshHistory(prev => !prev);
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const badge      = rank ? getRankBadge(rank)         : null;
  const motivation = rank ? getMotivation(rank, stream) : null;
  const isJEE      = stream === "PCM";
  const maxMap     = SUBJECT_MAX[stream];
  const examGrad   = isJEE ? "linear-gradient(135deg,#3b82f6,#8b5cf6)" : "linear-gradient(135deg,#10b981,#06b6d4)";
  const examShadow = isJEE ? "rgba(59,130,246,.35)" : "rgba(16,185,129,.35)";

  const runTotal = (parseFloat(physics)||0) + (parseFloat(chemistry)||0)
                 + (isJEE ? parseFloat(maths)||0 : parseFloat(biology)||0);

  // Pull best rank + avg percentile from server history so the top strip
  // stays accurate across sessions, not just the current session prediction
  const [historyStats, setHistoryStats] = useState({ bestRank:null, avgPercentile:null, total:0 });

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/history`, { headers:{ Authorization:"Bearer "+token } })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;
        const best = Math.min(...data.map(h => h.predicted_rank));
        const avg  = (data.reduce((s,h) => s+Number(h.percentile),0) / data.length).toFixed(1);
        setHistoryStats({ bestRank:best, avgPercentile:avg, total:data.length });
      })
      .catch(() => {});
  }, [token, refreshHistory]);

  // Displayed values in the top strip always reflect the latest known result
  const displayRank       = rank       ?? historyStats.bestRank;
  const displayPercentile = percentile ?? historyStats.avgPercentile;

  function handlePhysics(v)   { setPhysics(cap(v,   maxMap.physics));   }
  function handleChemistry(v) { setChemistry(cap(v, maxMap.chemistry)); }
  function handleMaths(v)     { setMaths(cap(v,     maxMap.maths));     }
  function handleBiology(v)   { setBiology(cap(v,   maxMap.biology));   }

  function handleStream(s) {
    setStream(s);
    setMaths(""); setBiology("");
    setError(""); setRank(null);
  }

  if (!token) return <Auth />;

  const subjects = [
    { label:"Physics",    value:physics,   handler:handlePhysics,   max:maxMap.physics,   color:isJEE?"#3b82f6":"#10b981" },
    { label:"Chemistry",  value:chemistry, handler:handleChemistry, max:maxMap.chemistry, color:isJEE?"#8b5cf6":"#06b6d4" },
    ...(isJEE
      ? [{ label:"Mathematics", value:maths,   handler:handleMaths,   max:100, color:"#a78bfa" }]
      : [{ label:"Biology",     value:biology, handler:handleBiology, max:360, color:"#34d399" }]),
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#07071a", color:"white", fontFamily:"'Sora',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes blobdrift { 0%{transform:scale(1) rotate(0deg)} 100%{transform:scale(1.15) rotate(12deg) translate(22px,18px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
        .scinput:focus { outline:none; border-color:rgba(249,115,22,.5)!important; box-shadow:0 0 0 3px rgba(249,115,22,.1)!important; background:rgba(249,115,22,.04)!important; }
        .rscroll { scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.12) transparent; }
        .rscroll::-webkit-scrollbar { width:3px; }
        .rscroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12); border-radius:2px; }
        .col-card { transition:transform .18s,border-color .18s; }
        .col-card:hover { transform:translateX(3px); }
      `}</style>

      {/* background blobs */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",width:700,height:700,borderRadius:"50%",background:"conic-gradient(from 0deg,#f97316,#ec4899,#8b5cf6,#3b82f6,#06b6d4,#f97316)",filter:"blur(110px)",opacity:.09,top:-250,left:-250,animation:"blobdrift 20s ease-in-out infinite alternate"}}/>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"conic-gradient(from 200deg,#10b981,#3b82f6,#8b5cf6)",filter:"blur(100px)",opacity:.08,bottom:-150,right:-150,animation:"blobdrift 22s ease-in-out infinite alternate",animationDelay:"-8s"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.016) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
      </div>

      {/* navbar */}
      <nav style={{position:"sticky",top:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.5rem",height:60,background:"rgba(7,7,26,.88)",backdropFilter:"blur(28px)",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#f97316,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:".85rem",boxShadow:"0 0 20px rgba(249,115,22,.4)"}}>ER</div>
          <div>
            <div style={{fontSize:"1rem",fontWeight:800,background:"linear-gradient(135deg,#f97316,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",lineHeight:1.2}}>ExamRank</div>
            <div style={{fontSize:".58rem",color:"rgba(255,255,255,.28)",letterSpacing:".07em"}}>JEE · NEET Predictor</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:3}}>
          {[["predict","🎯 Predict"],["history","📊 History"]].map(([tab,label])=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:"5px 18px",borderRadius:7,border:"none",background:activeTab===tab?"linear-gradient(135deg,#f97316,#ec4899)":"transparent",color:activeTab===tab?"white":"rgba(255,255,255,.4)",fontFamily:"'Sora',sans-serif",fontSize:".8rem",fontWeight:600,cursor:"pointer",boxShadow:activeTab===tab?"0 4px 14px rgba(249,115,22,.28)":"none",transition:"all .18s"}}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={logout} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.22)",borderRadius:8,color:"#fca5a5",fontFamily:"'Sora',sans-serif",fontSize:".76rem",cursor:"pointer"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </nav>

      <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"1.5rem 1.25rem 4rem"}}>

        {/* stats strip — values pulled from history so they persist across sessions */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:"1.5rem"}}>
          {[
            {label:"Predictions", value: historyStats.total > 0 ? String(historyStats.total) : (rank ? "1" : "0"),                                    icon:"🎯", c:"#06b6d4"},
            {label:"Best Rank",   value: displayRank       ? `#${Number(displayRank).toLocaleString()}`  : "—",  icon:"🏆", c:"#f59e0b"},
            {label:"Percentile",  value: displayPercentile ? `${displayPercentile}%`                    : "—",  icon:"📊", c:"#10b981"},
            {label:"Exam",        value: isJEE ? "JEE" : "NEET",                                                icon:isJEE?"⚛️":"🧬", c:"#a78bfa"},
          ].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:"14px 16px",backdropFilter:"blur(12px)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:10,right:12,fontSize:"1.1rem",opacity:.16}}>{s.icon}</div>
              <div style={{fontSize:".63rem",color:"rgba(255,255,255,.36)",textTransform:"uppercase",letterSpacing:".09em",marginBottom:5}}>{s.label}</div>
              <div style={{fontSize:"1.4rem",fontWeight:800,color:s.c}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* predict tab */}
        {activeTab === "predict" && (
          <div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:"1.25rem",alignItems:"start"}}>
            <div style={{position:"sticky",top:72,display:"flex",flexDirection:"column",gap:"1rem"}}>

              {/* exam selector */}
              <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:20,padding:"1.25rem",backdropFilter:"blur(16px)"}}>
                <div style={{fontSize:".62rem",fontWeight:700,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10}}>Select Exam</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {key:"PCM",icon:"⚛️",label:"JEE",  sub:"PCM · Max 300", grad:"linear-gradient(135deg,#3b82f6,#8b5cf6)", glow:"rgba(59,130,246,.35)"},
                    {key:"PCB",icon:"🧬",label:"NEET", sub:"PCB · Max 720", grad:"linear-gradient(135deg,#10b981,#06b6d4)", glow:"rgba(16,185,129,.35)"},
                  ].map(e=>(
                    <button key={e.key} onClick={()=>handleStream(e.key)} style={{padding:"13px 11px",borderRadius:13,cursor:"pointer",textAlign:"left",border:"1px solid",fontFamily:"'Sora',sans-serif",borderColor:stream===e.key?"transparent":"rgba(255,255,255,.1)",background:stream===e.key?e.grad:"rgba(255,255,255,.05)",color:stream===e.key?"white":"rgba(255,255,255,.4)",boxShadow:stream===e.key?`0 8px 22px ${e.glow}`:"none",transition:"all .22s",position:"relative",overflow:"hidden"}}>
                      {stream===e.key&&<div style={{position:"absolute",inset:0,background:"rgba(255,255,255,.08)",borderRadius:13}}/>}
                      <div style={{position:"relative",zIndex:1}}>
                        <div style={{fontSize:"1.3rem",marginBottom:5}}>{e.icon}</div>
                        <div style={{fontSize:".88rem",fontWeight:700}}>{e.label}</div>
                        <div style={{fontSize:".62rem",opacity:.7,marginTop:2}}>{e.sub}</div>
                      </div>
                      {stream===e.key&&<div style={{position:"absolute",top:8,right:9,fontSize:".6rem",background:"rgba(255,255,255,.22)",padding:"1px 6px",borderRadius:7,zIndex:1}}>✓</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* marks inputs */}
              <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:20,padding:"1.25rem",backdropFilter:"blur(16px)"}}>
                <div style={{fontSize:".62rem",fontWeight:700,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10}}>Subject Marks</div>
                <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:"1rem"}}>
                  {subjects.map(f=>{
                    const v   = parseFloat(f.value)||0;
                    const pct = f.max>0 ? Math.min((v/f.max)*100,100) : 0;
                    const over= f.value!=="" && parseFloat(f.value)>f.max;
                    return (
                      <div key={f.label}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <span style={{fontSize:".8rem",fontWeight:600,color:"rgba(255,255,255,.8)"}}>{f.label}</span>
                          <span style={{fontSize:".64rem",padding:"1px 8px",borderRadius:8,transition:"all .2s",
                            color:over?"#f87171":"rgba(255,255,255,.3)",
                            background:over?"rgba(239,68,68,.12)":"rgba(255,255,255,.05)",
                            border:over?"1px solid rgba(239,68,68,.3)":"1px solid transparent"}}>
                            {v} / {f.max}
                          </span>
                        </div>
                        <input className="scinput" type="number" min="0" max={f.max} placeholder="0"
                          value={f.value}
                          onChange={e=>f.handler(e.target.value)}
                          onBlur={e=>f.handler(e.target.value)}
                          style={{width:"100%",padding:"9px 12px",background:over?"rgba(239,68,68,.07)":"rgba(255,255,255,.06)",border:`1px solid ${over?"rgba(239,68,68,.4)":"rgba(255,255,255,.09)"}`,borderRadius:9,color:"white",fontFamily:"'Sora',sans-serif",fontSize:"1rem",fontWeight:600,transition:"all .2s"}}/>
                        <div style={{height:3,background:"rgba(255,255,255,.07)",borderRadius:2,overflow:"hidden",marginTop:5}}>
                          <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.35,ease:"easeOut"}}
                            style={{height:"100%",borderRadius:2,background:f.color}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                          <span style={{fontSize:".58rem",color:"rgba(255,255,255,.22)"}}>{Math.round(pct)}%</span>
                          {over&&<span style={{fontSize:".6rem",color:"#f87171"}}>⚠ Max is {f.max}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* total score — white text so it's always visible */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:isJEE?"rgba(59,130,246,.1)":"rgba(16,185,129,.1)",border:`1px solid ${isJEE?"rgba(59,130,246,.28)":"rgba(16,185,129,.28)"}`,borderRadius:11,marginBottom:"1rem"}}>
                  <div>
                    <div style={{fontSize:".66rem",color:"rgba(255,255,255,.48)",textTransform:"uppercase",letterSpacing:".08em"}}>Total Score</div>
                    <div style={{fontSize:".58rem",color:"rgba(255,255,255,.25)"}}>out of {TOTAL_MAX[stream]}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                    <span style={{fontSize:"2.2rem",fontWeight:900,color:"white",lineHeight:1}}>{runTotal}</span>
                    <span style={{fontSize:".7rem",color:"rgba(255,255,255,.4)",fontWeight:500}}>/{TOTAL_MAX[stream]}</span>
                  </div>
                </div>

                {error&&<div style={{padding:"8px 12px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:9,color:"#fca5a5",fontSize:".78rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:6}}>⚠️ {error}</div>}

                <button disabled={loading} onClick={predictRank} style={{width:"100%",padding:"13px",border:"none",borderRadius:12,background:examGrad,color:"white",fontFamily:"'Sora',sans-serif",fontSize:".9rem",fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?.5:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 8px 26px ${examShadow}`,transition:"all .2s"}}>
                  {loading
                    ?<><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%",display:"inline-block",animation:"spin .75s linear infinite"}}/> Predicting…</>
                    :<><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg> Predict {isJEE?"JEE":"NEET"} Rank</>
                  }
                </button>
              </div>
            </div>

            {/* right panel - natural height, only scrolls when content exceeds viewport */}
            <div className="rscroll" style={{overflowY:"auto",paddingRight:4,paddingBottom:8}}>
              {rank===null ? (
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:22,padding:"3rem 2rem",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",minHeight:460,gap:"1rem"}}>
                  <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem"}}>🎯</div>
                  <div>
                    <div style={{fontSize:"1.05rem",fontWeight:700,color:"white",marginBottom:6}}>Ready to predict?</div>
                    <p style={{color:"rgba(255,255,255,.3)",fontSize:".82rem",lineHeight:1.65,maxWidth:240,margin:"0 auto"}}>Enter your subject marks on the left and click Predict to see your rank, percentile and guidance.</p>
                  </div>
                  <div style={{display:"flex",gap:"1.5rem",paddingTop:"1rem",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                    {[["AIR 1","JEE 2024 Top"],["720/720","NEET Perfect"],["50K+","Predictions Done"]].map(([v,l])=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div style={{fontSize:"1rem",fontWeight:800,background:"linear-gradient(135deg,#f97316,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>{v}</div>
                        <div style={{fontSize:".6rem",color:"rgba(255,255,255,.24)",marginTop:2}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.3}} style={{display:"flex",flexDirection:"column",gap:"1rem",paddingBottom:8}}>

                  {/* rank hero */}
                  <div style={{borderRadius:22,padding:"1.75rem",textAlign:"center",position:"relative",overflow:"hidden",background:"#0d0d22",border:`1px solid ${isJEE?"rgba(59,130,246,.38)":"rgba(16,185,129,.38)"}`,boxShadow:`0 0 40px ${isJEE?"rgba(59,130,246,.15)":"rgba(16,185,129,.15)"}`}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:examGrad}}/>
                    <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",background:isJEE?"rgba(59,130,246,.05)":"rgba(16,185,129,.05)"}}/>
                    <div style={{position:"relative",zIndex:1}}>
                      <span style={{display:"inline-block",padding:"4px 14px",borderRadius:20,background:examGrad,fontSize:".68rem",fontWeight:600,color:"white",marginBottom:14,letterSpacing:".06em"}}>
                        {isJEE?"⚛️ JEE MAIN":"🧬 NEET"} · RESULT
                      </span>
                      <div style={{fontSize:"3.8rem",fontWeight:900,color:"white",lineHeight:1,letterSpacing:"-.02em"}}>#{rank.toLocaleString()}</div>
                      <div style={{fontSize:".7rem",color:"rgba(255,255,255,.38)",marginTop:10,textTransform:"uppercase",letterSpacing:".06em"}}>Predicted Rank</div>
                      <div style={{display:"inline-block",marginTop:8,padding:"4px 12px",background:"rgba(255,255,255,.07)",borderRadius:8,fontSize:".72rem",color:"rgba(255,255,255,.5)"}}>{totalMarks} marks submitted</div>
                    </div>
                  </div>

                  {/* stats grid */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    {[
                      {label:"Total Marks", value:totalMarks,       color:"#06b6d4", bg:"rgba(6,182,212,.1)",    border:"rgba(6,182,212,.24)",   icon:"📝"},
                      {label:"Percentile",  value:`${percentile}%`, color:"#10b981", bg:"rgba(16,185,129,.1)",   border:"rgba(16,185,129,.24)",  icon:"📊"},
                      {label:"Confidence",  value:`${confidence}%`, color:"#a78bfa", bg:"rgba(167,139,250,.1)",  border:"rgba(167,139,250,.24)", icon:"🎯"},
                    ].map(s=>(
                      <div key={s.label} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:14,padding:"14px 12px",textAlign:"center",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:8,right:9,fontSize:".9rem",opacity:.18}}>{s.icon}</div>
                        <div style={{fontSize:".58rem",color:"rgba(255,255,255,.42)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{s.label}</div>
                        <div style={{fontSize:"1.4rem",fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* percentile bar */}
                  <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:"14px 16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{fontSize:".74rem",color:"rgba(255,255,255,.45)",fontWeight:500}}>Performance Indicator</span>
                      <span style={{fontSize:".82rem",fontWeight:800,color:isJEE?"#3b82f6":"#10b981"}}>{percentile}%</span>
                    </div>
                    <div style={{height:8,background:"rgba(255,255,255,.07)",borderRadius:4,overflow:"hidden"}}>
                      <motion.div initial={{width:0}} animate={{width:`${percentile}%`}} transition={{delay:.3,duration:.8,ease:"easeOut"}}
                        style={{height:"100%",borderRadius:4,background:examGrad,boxShadow:`0 0 10px ${isJEE?"rgba(59,130,246,.5)":"rgba(16,185,129,.5)"}`}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                      <span style={{fontSize:".6rem",color:"rgba(255,255,255,.2)"}}>0%</span>
                      <span style={{fontSize:".6rem",color:"rgba(255,255,255,.2)"}}>100%</span>
                    </div>
                  </div>

                  {/* rank chart */}
                  <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:"16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:".8rem",fontWeight:700,color:"white",marginBottom:2}}>Marks vs Rank Curve</div>
                        <div style={{fontSize:".63rem",color:"rgba(255,255,255,.3)"}}>Your position on the distribution</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:".6rem",color:"rgba(255,255,255,.28)",textTransform:"uppercase",letterSpacing:".06em"}}>Your Score</div>
                        <div style={{fontSize:".88rem",fontWeight:800,color:isJEE?"#3b82f6":"#10b981"}}>{totalMarks} Marks</div>
                      </div>
                    </div>
                    <RankChart marks={totalMarks} rank={rank} stream={stream} />
                  </div>

                  {/* badge + motivation merged */}
                  {badge && motivation && (
                    <div style={{background:"#0d0d22",border:`1px solid ${motivation.color}28`,borderRadius:18,padding:"1.25rem 1.4rem",boxShadow:`0 0 40px ${motivation.glow}`,position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${motivation.color}0c,transparent 55%)`,pointerEvents:"none"}}/>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${motivation.color},transparent)`}}/>
                      <div style={{position:"relative",zIndex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.07)"}}>
                          <div style={{width:40,height:40,borderRadius:10,background:`${motivation.color}1a`,border:`1px solid ${motivation.color}38`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0}}>
                            {badge.title.split(" ")[0]}
                          </div>
                          <div>
                            <div style={{fontSize:".6rem",fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:motivation.color,marginBottom:2}}>{motivation.tier}</div>
                            <div style={{fontSize:".88rem",fontWeight:700,color:"white"}}>{badge.title.slice(badge.title.indexOf(" ")+1)}</div>
                          </div>
                        </div>
                        <div style={{fontSize:".95rem",fontWeight:700,color:"white",marginBottom:6}}>{motivation.emoji} {motivation.headline}</div>
                        <div style={{fontSize:".8rem",color:"rgba(255,255,255,.5)",lineHeight:1.68}}>{motivation.body}</div>
                      </div>
                    </div>
                  )}

                  {/* performance insight */}
                  <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:"14px 16px"}}>
                    <div style={{fontSize:".7rem",fontWeight:700,color:"rgba(255,255,255,.38)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Performance Insight</div>
                    {rank<=1000&&<p style={{fontSize:".82rem",color:"#10b981",lineHeight:1.65,margin:0}}>🌟 Outstanding performance. You are competing among the top candidates nationwide.</p>}
                    {rank>1000&&rank<=10000&&<p style={{fontSize:".82rem",color:"#f59e0b",lineHeight:1.65,margin:0}}>⚡ Strong score. A small improvement could significantly boost your rank.</p>}
                    {rank>10000&&<p style={{fontSize:".82rem",color:"#a78bfa",lineHeight:1.65,margin:0}}>🔥 Keep practicing. Focused revision can dramatically improve your percentile.</p>}
                  </div>

                  {/* recommended colleges */}
                  <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:14,padding:"14px 16px",marginBottom:8}}>
                    <div style={{fontSize:".7rem",fontWeight:700,color:"rgba(255,255,255,.38)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>🎓 Recommended Colleges</div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {stream==="PCM"&&rank<=5000   &&["NIT Trichy","NIT Surathkal","NIT Warangal","IIIT Hyderabad"].map(c=>(<div key={c} className="col-card" style={{fontSize:".8rem",color:"rgba(255,255,255,.7)",padding:"9px 12px",background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.18)",borderRadius:9,display:"flex",alignItems:"center",gap:8}}><span style={{color:"#3b82f6"}}>🏛</span>{c}</div>))}
                      {stream==="PCM"&&rank>5000&&rank<=20000&&["NIT Hamirpur","NIT Jalandhar","IIIT Kottayam","IIIT Bhagalpur"].map(c=>(<div key={c} className="col-card" style={{fontSize:".8rem",color:"rgba(255,255,255,.7)",padding:"9px 12px",background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.18)",borderRadius:9,display:"flex",alignItems:"center",gap:8}}><span style={{color:"#a78bfa"}}>🏛</span>{c}</div>))}
                      {stream==="PCM"&&rank>20000  &&["State Government Colleges","Private Engineering Colleges","Newer IIITs"].map(c=>(<div key={c} className="col-card" style={{fontSize:".8rem",color:"rgba(255,255,255,.7)",padding:"9px 12px",background:"rgba(249,115,22,.08)",border:"1px solid rgba(249,115,22,.18)",borderRadius:9,display:"flex",alignItems:"center",gap:8}}><span style={{color:"#f97316"}}>🏛</span>{c}</div>))}
                      {stream==="PCB"&&rank<=10000 &&["Government Medical Colleges","AIIMS (depending on category)","Top State Medical Colleges"].map(c=>(<div key={c} className="col-card" style={{fontSize:".8rem",color:"rgba(255,255,255,.7)",padding:"9px 12px",background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.18)",borderRadius:9,display:"flex",alignItems:"center",gap:8}}><span style={{color:"#10b981"}}>🏥</span>{c}</div>))}
                      {stream==="PCB"&&rank>10000  &&["State Medical Colleges","Semi-Government Medical Colleges","Private Medical Colleges"].map(c=>(<div key={c} className="col-card" style={{fontSize:".8rem",color:"rgba(255,255,255,.7)",padding:"9px 12px",background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.18)",borderRadius:9,display:"flex",alignItems:"center",gap:8}}><span style={{color:"#06b6d4"}}>🏥</span>{c}</div>))}
                    </div>
                  </div>

                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* history tab */}
        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{opacity:0,y:14}}
            animate={{opacity:1,y:0}}
            transition={{duration:.28}}
            style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:22,padding:"1.5rem",backdropFilter:"blur(16px)"}}
          >
            <History refresh={refreshHistory} />
          </motion.div>
        )}

      </div>
    </div>
  );
}
