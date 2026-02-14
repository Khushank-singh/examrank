import { useState } from "react";
import History from "./History";

function App() {

  const [stream, setStream] = useState("PCM");

  const [physics, setPhysics] = useState("");
  const [chemistry, setChemistry] = useState("");
  const [maths, setMaths] = useState("");
  const [biology, setBiology] = useState("");

  const [total, setTotal] = useState(null);
  const [rank, setRank] = useState(null);

  const predictRank = async () => {

    if (
      physics === "" ||
      chemistry === "" ||
      (stream === "PCM" && maths === "") ||
      (stream === "PCB" && biology === "")
    ) {
      alert("Please enter all required marks");
      return;
    }

    try {

      const requestData = {
        physics: Number(physics),
        chemistry: Number(chemistry),
        maths: stream === "PCM" ? Number(maths) : 0,
        biology: stream === "PCB" ? Number(biology) : 0,
        stream: stream
      };

      const res = await fetch(
        "http://localhost:4000/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestData)
        }
      );

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setTotal(data.total);
      setRank(data.predicted_rank); // FIXED

    } catch (err) {

      console.error("Prediction error:", err);
      alert("Backend or ML service not responding");

    }
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "none",
    marginBottom: 12
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020617",
      color: "white",
      padding: 20
    }}>

      {/* Prediction Card */}
      <div style={{
        margin: "auto",
        background: "#020617",
        padding: 30,
        borderRadius: 16,
        width: 350,
        boxShadow: "0 0 20px rgba(0,0,0,.6)"
      }}>

        <h1>ExamRank</h1>

        <select
          style={inputStyle}
          value={stream}
          onChange={(e) => {

            const selectedStream = e.target.value;
            setStream(selectedStream);

            if (selectedStream === "PCM") {
              setBiology("");
            } else {
              setMaths("");
            }

            setTotal(null);
            setRank(null);

          }}
        >
          <option value="PCM">PCM</option>
          <option value="PCB">PCB</option>
        </select>

        <input
          type="number"
          style={inputStyle}
          placeholder="Physics"
          value={physics}
          onChange={(e) => setPhysics(e.target.value)}
        />

        <input
          type="number"
          style={inputStyle}
          placeholder="Chemistry"
          value={chemistry}
          onChange={(e) => setChemistry(e.target.value)}
        />

        {stream === "PCM" && (
          <input
            type="number"
            style={inputStyle}
            placeholder="Maths"
            value={maths}
            onChange={(e) => setMaths(e.target.value)}
          />
        )}

        {stream === "PCB" && (
          <input
            type="number"
            style={inputStyle}
            placeholder="Biology"
            value={biology}
            onChange={(e) => setBiology(e.target.value)}
          />
        )}

        <button
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          onClick={predictRank}
        >
          Predict Rank
        </button>

        {rank !== null && total !== null && (
          <div style={{
            marginTop: 20,
            padding: 10,
            background: "#0f172a",
            borderRadius: 10
          }}>
            <h3>Total Marks: {total}</h3>
            <h3>Expected Rank: ~{rank}</h3>
          </div>
        )}

      </div>

      {/* History Section */}
      <div style={{ marginTop: 40 }}>
        <History />
      </div>

    </div>
  );
}

export default App;
