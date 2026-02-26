import { useState } from "react";
import History from "./History";
import Auth from "./Auth";

export default function App() {

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [stream, setStream] = useState("PCM");
  const [physics, setPhysics] = useState("");
  const [chemistry, setChemistry] = useState("");
  const [maths, setMaths] = useState("");
  const [biology, setBiology] = useState("");

  const [rank, setRank] = useState(null);
  const [percentile, setPercentile] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [totalMarks, setTotalMarks] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshHistory, setRefreshHistory] = useState(false);

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
        physics: Number(physics) || 0,
        chemistry: Number(chemistry) || 0,
        maths: stream === "PCM" ? Number(maths) || 0 : 0,
        biology: stream === "PCB" ? Number(biology) || 0 : 0,
        stream
      };

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Prediction failed");
        return;
      }

      setRank(data.predicted_rank);
      setPercentile(data.percentile);
      setConfidence(data.confidence);
      setTotalMarks(data.total_marks);

      // 🔥 refresh history instantly
      setRefreshHistory(prev => !prev);

    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">

      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold text-cyan-400">
          ExamRank Dashboard
        </h1>
        <button
          onClick={logout}
          className="bg-red-500 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-slate-800 p-6 rounded-lg">

          <h2 className="text-lg mb-4 text-cyan-400">
            Enter Your Marks
          </h2>

          <select
            className="w-full mb-3 p-2 bg-slate-700 rounded"
            value={stream}
            onChange={e => setStream(e.target.value)}
          >
            <option value="PCM">JEE (PCM)</option>
            <option value="PCB">NEET (PCB)</option>
          </select>

          <input
            placeholder="Physics"
            className="w-full mb-3 p-2 bg-slate-700 rounded"
            value={physics}
            onChange={e => setPhysics(e.target.value)}
          />

          <input
            placeholder="Chemistry"
            className="w-full mb-3 p-2 bg-slate-700 rounded"
            value={chemistry}
            onChange={e => setChemistry(e.target.value)}
          />

          {stream === "PCM" && (
            <input
              placeholder="Maths"
              className="w-full mb-3 p-2 bg-slate-700 rounded"
              value={maths}
              onChange={e => setMaths(e.target.value)}
            />
          )}

          {stream === "PCB" && (
            <input
              placeholder="Biology"
              className="w-full mb-3 p-2 bg-slate-700 rounded"
              value={biology}
              onChange={e => setBiology(e.target.value)}
            />
          )}

          <button
            disabled={loading}
            onClick={predictRank}
            className="w-full bg-cyan-500 py-2 rounded mt-2 disabled:opacity-50"
          >
            {loading ? "Predicting..." : "Predict Rank"}
          </button>

          {error && (
            <div className="mt-3 text-red-400">
              {error}
            </div>
          )}

          {rank !== null && (
            <div className="mt-4 bg-green-900/40 p-4 rounded">
              <p>Total Marks: {totalMarks}</p>
              <p>Rank: {rank}</p>
              <p>Percentile: {percentile}%</p>
              <p>Confidence: {confidence}%</p>
            </div>
          )}

        </div>

        <div className="bg-slate-800 p-6 rounded-lg">
          <History refresh={refreshHistory} />
        </div>

      </div>
    </div>
  );
}