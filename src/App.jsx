import { useState } from "react";

function App() {
  const [physics, setPhysics] = useState("");
  const [chemistry, setChemistry] = useState("");
  const [maths, setMaths] = useState("");
  const [total, setTotal] = useState(null);
  const [rank, setRank] = useState(null);

  const predictRank = async () => {
    if (!physics || !chemistry || !maths) {
      alert("Enter all marks");
      return;
    }

    const res = await fetch("http://localhost:4000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ physics, chemistry, maths }),
    });

    const data = await res.json();

    setTotal(data.total);
    setRank(data.rank);
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "none",
    marginBottom: 12,
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#020617",
      color: "white"
    }}>
      <div style={{
        background: "#020617",
        padding: 30,
        borderRadius: 16,
        width: 350,
        boxShadow: "0 0 20px rgba(0,0,0,.6)"
      }}>
        <h1>ExamRank</h1>

        <input style={inputStyle} placeholder="Physics" value={physics}
          onChange={e => setPhysics(e.target.value)} />

        <input style={inputStyle} placeholder="Chemistry" value={chemistry}
          onChange={e => setChemistry(e.target.value)} />

        <input style={inputStyle} placeholder="Maths" value={maths}
          onChange={e => setMaths(e.target.value)} />

        <button style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "none",
          background: "#2563eb",
          color: "white"
        }} onClick={predictRank}>
          Predict Rank
        </button>

        {total && (
          <div style={{ marginTop: 15 }}>
            <h3>Total: {total}</h3>
            <h3>Rank: ~{rank}</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
