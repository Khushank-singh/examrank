import { useState } from "react";

function Auth() {

  /* ── ALL STATE — UNCHANGED ── */
  const [isLogin,    setIsLogin]    = useState(true);
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [verifyLink, setVerifyLink] = useState(""); // kept — still handles old accounts that haven't verified

  // New: success message state for post-signup feedback
  const [successMsg, setSuccessMsg] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  /* ── handleSubmit — logic UNCHANGED, added auto-switch on signup ── */
  async function handleSubmit() {
    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");
    setVerifyLink("");
    setSuccessMsg("");

    const url  = isLogin ? `${API_URL}/auth/login`  : `${API_URL}/auth/signup`;
    const body = isLogin ? { email, password }       : { name, email, password };

    try {
      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          // LOGIN SUCCESS — UNCHANGED
          localStorage.setItem("token", data.token);
          window.location.reload();
        } else {
          // SIGNUP SUCCESS — switch to login tab automatically
          setSuccessMsg("Account created! Please sign in.");
          setName("");
          setEmail("");
          setPassword("");
          // Auto-switch to login after 1.2 s so user sees the message
          setTimeout(() => {
            setIsLogin(true);
            setSuccessMsg("");
          }, 1200);
        }
      } else {
        setError(data.error || "Request failed");
        // 🔥 UNCHANGED — still handles old unverified accounts
        if (data.verifyLink) {
          setVerifyLink(data.verifyLink);
        }
      }

    } catch (err) {
      console.error("Auth error:", err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  /* ── switchMode — UNCHANGED logic ── */
  function switchMode() {
    if (!loading) {
      setIsLogin(!isLogin);
      setName("");
      setEmail("");
      setPassword("");
      setError("");
      setSuccessMsg("");
      setVerifyLink("");
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#07071a", fontFamily:"'Sora',sans-serif", overflow:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes blobdrift { 0%{transform:scale(1) rotate(0deg)} 100%{transform:scale(1.15) rotate(14deg) translate(24px,18px)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        * { box-sizing:border-box; }
        .auth-input { transition:border-color .2s,box-shadow .2s,background .2s; }
        .auth-input:focus { outline:none; border-color:rgba(249,115,22,.55)!important; box-shadow:0 0 0 3px rgba(249,115,22,.1)!important; background:rgba(249,115,22,.04)!important; }
        .auth-input::placeholder { color:rgba(255,255,255,.22); }
        .submit-btn:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); box-shadow:0 14px 38px rgba(249,115,22,.45)!important; }
        .submit-btn { transition:all .2s; }
        .switch-link:hover span { color:#f97316!important; }
      `}</style>

      {/* ── Blobs ── */}
      <div style={{ position:"absolute", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"conic-gradient(from 0deg,#f97316,#ec4899,#8b5cf6,#3b82f6,#06b6d4,#f97316)", filter:"blur(110px)", opacity:.09, top:-220, left:-220, animation:"blobdrift 20s ease-in-out infinite alternate" }}/>
        <div style={{ position:"absolute", width:450, height:450, borderRadius:"50%", background:"conic-gradient(from 180deg,#10b981,#3b82f6,#8b5cf6)", filter:"blur(100px)", opacity:.08, bottom:-150, right:-150, animation:"blobdrift 22s ease-in-out infinite alternate", animationDelay:"-8s" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.016) 1px,transparent 1px)", backgroundSize:"48px 48px" }}/>
      </div>

      {/* ── Card ── */}
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420, margin:"0 1rem", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:24, padding:"2.25rem 2rem", backdropFilter:"blur(24px)", boxShadow:"0 32px 80px rgba(0,0,0,.5)", animation:"fadeUp .4s ease both" }}>

        {/* Logo */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:"1.6rem" }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#f97316,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:"1.1rem", boxShadow:"0 0 28px rgba(249,115,22,.45)", marginBottom:10 }}>ER</div>
          <div style={{ fontSize:"1.35rem", fontWeight:800, background:"linear-gradient(135deg,#f97316,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", lineHeight:1.2 }}>ExamRank</div>
          <div style={{ fontSize:".65rem", color:"rgba(255,255,255,.3)", letterSpacing:".08em", marginTop:3 }}>JEE · NEET Rank Predictor</div>
        </div>

        {/* Tab toggle */}
        <div style={{ display:"flex", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:4, marginBottom:"1.4rem" }}>
          {[["login","Sign In"],["signup","Sign Up"]].map(([mode,label])=>(
            <button key={mode}
              onClick={()=>{ if(!loading){ setIsLogin(mode==="login"); setName(""); setEmail(""); setPassword(""); setError(""); setSuccessMsg(""); setVerifyLink(""); }}}
              style={{ flex:1, padding:"8px", borderRadius:9, border:"none", fontFamily:"'Sora',sans-serif", fontSize:".82rem", fontWeight:600, cursor:loading?"not-allowed":"pointer", transition:"all .18s",
                background: (isLogin&&mode==="login")||(!isLogin&&mode==="signup") ? "linear-gradient(135deg,#f97316,#ec4899)" : "transparent",
                color:      (isLogin&&mode==="login")||(!isLogin&&mode==="signup") ? "white" : "rgba(255,255,255,.38)",
                boxShadow:  (isLogin&&mode==="login")||(!isLogin&&mode==="signup") ? "0 4px 16px rgba(249,115,22,.3)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:"1rem" }}>

          {/* Name — only signup, UNCHANGED condition */}
          {!isLogin && (
            <div>
              <label style={{ fontSize:".65rem", fontWeight:600, color:"rgba(255,255,255,.35)", textTransform:"uppercase", letterSpacing:".1em", display:"block", marginBottom:5 }}>Full Name</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.22)", pointerEvents:"none" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </span>
                <input className="auth-input" type="text" placeholder="Your full name" value={name}
                  onChange={e=>setName(e.target.value)}
                  style={{ width:"100%", padding:"10px 12px 10px 34px", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"white", fontFamily:"'Sora',sans-serif", fontSize:".88rem" }}/>
              </div>
            </div>
          )}

          {/* Email — UNCHANGED */}
          <div>
            <label style={{ fontSize:".65rem", fontWeight:600, color:"rgba(255,255,255,.35)", textTransform:"uppercase", letterSpacing:".1em", display:"block", marginBottom:5 }}>Email</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.22)", pointerEvents:"none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </span>
              <input className="auth-input" type="email" placeholder="you@email.com" value={email}
                onChange={e=>setEmail(e.target.value)}
                style={{ width:"100%", padding:"10px 12px 10px 34px", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"white", fontFamily:"'Sora',sans-serif", fontSize:".88rem" }}/>
            </div>
          </div>

          {/* Password — UNCHANGED */}
          <div>
            <label style={{ fontSize:".65rem", fontWeight:600, color:"rgba(255,255,255,.35)", textTransform:"uppercase", letterSpacing:".1em", display:"block", marginBottom:5 }}>Password</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.22)", pointerEvents:"none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input className="auth-input" type="password" placeholder="Your password" value={password}
                onChange={e=>setPassword(e.target.value)}
                style={{ width:"100%", padding:"10px 12px 10px 34px", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"white", fontFamily:"'Sora',sans-serif", fontSize:".88rem" }}/>
            </div>
          </div>
        </div>

        {/* Success message — new signup flow */}
        {successMsg && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", background:"rgba(16,185,129,.1)", border:"1px solid rgba(16,185,129,.28)", borderRadius:9, color:"#6ee7b7", fontSize:".8rem", marginBottom:"1rem", animation:"fadeIn .3s ease" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {successMsg}
          </div>
        )}

        {/* Error — UNCHANGED condition */}
        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 12px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.28)", borderRadius:9, color:"#fca5a5", fontSize:".8rem", marginBottom:"1rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* verifyLink — UNCHANGED, handles old unverified accounts */}
        {verifyLink && (
          <div style={{ marginTop:0, background:"rgba(2,44,34,.8)", border:"1px solid rgba(16,185,129,.25)", padding:"11px 13px", borderRadius:10, marginBottom:"1rem" }}>
            <p style={{ color:"#10b981", fontSize:".78rem", margin:"0 0 5px", fontWeight:500 }}>Account not verified. Click to verify:</p>
            <a href={verifyLink} target="_blank" rel="noopener noreferrer"
              style={{ color:"#3b82f6", fontSize:".78rem", fontWeight:600, textDecoration:"none" }}>
              → Verify Account
            </a>
          </div>
        )}

        {/* Submit — UNCHANGED onClick, disabled, text logic */}
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}
          style={{ width:"100%", padding:"12px", border:"none", borderRadius:12, background:"linear-gradient(135deg,#f97316,#ec4899)", color:"white", fontFamily:"'Sora',sans-serif", fontSize:".9rem", fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?.55:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, letterSpacing:".02em", boxShadow:"0 8px 28px rgba(249,115,22,.3)" }}>
          {loading
            ? <><span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%", display:"inline-block", animation:"spin .75s linear infinite" }}/> Processing…</>
            : isLogin
              ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign In</>
              : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Create Account</>
          }
        </button>

        {/* Switch mode — UNCHANGED logic */}
        <p onClick={switchMode} className="switch-link"
          style={{ color:"rgba(255,255,255,.35)", cursor:loading?"not-allowed":"pointer", marginTop:"1.1rem", textAlign:"center", fontSize:".82rem", userSelect:"none" }}>
          {isLogin
            ? <>Don't have an account? <span style={{ color:"#f97316", fontWeight:600, transition:"color .2s" }}>Sign up free</span></>
            : <>Already have an account? <span style={{ color:"#f97316", fontWeight:600, transition:"color .2s" }}>Sign in</span></>
          }
        </p>

      </div>
    </div>
  );
}

export default Auth;
