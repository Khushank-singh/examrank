import { useEffect, useState } from "react";

function History() {

    const [history, setHistory] = useState([]);
    const API_URL = import.meta.env.VITE_API_URL;

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
                console.error("Invalid history response:", data);
            }

        })
        .catch(err => {
            console.error("History fetch error:", err);
        });

    }, [token]);

    if (!token) {
        return <p>Please login to view history.</p>;
    }

    if (history.length === 0) {
        return <p>No predictions yet.</p>;
    }

    return (

        <div>

            {history.map((item) => (

                <div key={item.id} style={cardStyle}>

                    <div>
                        Stream: {item.stream}
                    </div>

                    <div>
                        Total Marks: {item.total}
                    </div>

                    <div>
                        Rank: {item.predicted_rank}
                    </div>

                    <div>
                        Percentile: {item.percentile}%
                    </div>

                    <div>
                        Confidence: {item.confidence}%
                    </div>

                    <div style={dateStyle}>
                        {new Date(item.created_at).toLocaleString()}
                    </div>

                </div>

            ))}

        </div>

    );

}

const cardStyle = {
    background: "#020617",
    padding: "12px",
    borderRadius: "6px",
    marginTop: "10px",
    border: "1px solid #1e293b",
    lineHeight: "1.6"
};

const dateStyle = {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "5px"
};

export default History;