import { useState } from "react";

function App() {
  const [physics, setPhysics] = useState("");
  const [chemistry, setChemistry] = useState("");
  const [maths, setMaths] = useState("");
  const [total, setTotal] = useState(null);
  const [rank, setRank] = useState(null);

  const calculateTotal = () => {
    if (!physics || !chemistry || !maths) {
      alert("Please enter all subject marks");
      return;
    }

    const sum =
      Number(physics) +
      Number(chemistry) +
      Number(maths);

    setTotal(sum);

    // Temporary rank logic (will replace with ML later)
    const estimatedRank = Math.max(1, 200000 - sum * 500);
    setRank(estimatedRank);
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    marginBottom: "12px"
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg,#020617,#020617)",
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
        <p>Enter your marks</p>

        <input
          style={inputStyle}
          placeholder="Physics"
          value={physics}
          onChange={e => setPhysics(e.target.value)}
        />

        <input
          style={inputStyle}
          placeholder="Chemistry"
          value={chemistry}
          onChange={e => setChemistry(e.target.value)}
        />

        <input
          style={inputStyle}
          placeholder="Maths"
          value={maths}
          onChange={e => setMaths(e.target.value)}
        />

        <button style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "none",
          background: "#2563eb",
          color: "white",
          cursor: "pointer"
        }}
        onClick={calculateTotal}>
          Predict Rank
        </button>

        {total !== null && (
          <div style={{ marginTop: 15 }}>
            <h3>Total Marks: {total}</h3>
            <h3>Expected Rank: ~{rank}</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
