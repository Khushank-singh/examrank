import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function History({ refresh }) {
    const API_URL = import.meta.env.VITE_API_URL;
    const [history, setHistory] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) return;

        setLoading(true);
        fetch(`${API_URL}/history`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setHistory(data);
            } else {
                setError("Failed to load history.");
            }
        })
        .catch(() => {
            setError("Server error.");
        })
        .finally(() => {
            setLoading(false);
        });

    }, [token, refresh, API_URL]);

    if (!token) return <p className="text-slate-400 text-sm">Please login to view history.</p>;
    
    if (loading && history.length === 0) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error) return <p className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl">{error}</p>;
    
    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <p className="text-base font-medium text-slate-400">No predictions yet</p>
                <p className="text-sm text-slate-500 mt-1">Submit your marks to get started</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
                {history.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="bg-slate-950/70 border border-slate-800/70 p-5 rounded-2xl hover:border-slate-600/80 hover:bg-slate-900/60 transition-all duration-300 group flex flex-col gap-4"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                {item.stream}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(item.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                            </span>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                                <p className="text-[9px] uppercase text-slate-500 tracking-widest mb-1">Score</p>
                                <p className="text-xl font-black text-slate-100">{item.total}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                                <p className="text-[9px] uppercase text-cyan-500 tracking-widest mb-1">Rank</p>
                                <p className="text-xl font-black text-cyan-400">#{item.predicted_rank.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                                <p className="text-[9px] uppercase text-slate-500 tracking-widest mb-1">Percentile</p>
                                <p className="text-base font-bold text-emerald-400">{item.percentile}%</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                                <p className="text-[9px] uppercase text-slate-500 tracking-widest mb-1">Confidence</p>
                                <p className="text-base font-bold text-purple-400">{item.confidence}%</p>
                            </div>
                        </div>

                        {/* Percentile bar */}
                        <div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.percentile}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.05 + 0.2, ease: "easeOut" }}
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export default History;