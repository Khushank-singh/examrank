import { useEffect, useState } from "react";

function History({ refresh }) {

    const API_URL = import.meta.env.VITE_API_URL;
    const [history, setHistory] = useState([]);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {

        if (!token) return;

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
        });

    }, [token, refresh]);

    if (!token) return <p>Please login.</p>;
    if (error) return <p className="text-red-400">{error}</p>;
    if (history.length === 0) return <p>No predictions yet.</p>;

    return (
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
            {history.map((item) => (
                <div
                    key={item.id}
                    className="bg-slate-700 p-4 rounded-lg shadow text-sm"
                >
                    <p className="text-cyan-400 font-semibold">
                        {item.stream}
                    </p>
                    <p>Total: {item.total}</p>
                    <p>Rank: {item.predicted_rank}</p>
                    <p>Percentile: {item.percentile}%</p>
                    <p>Confidence: {item.confidence}%</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleString()}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default History;