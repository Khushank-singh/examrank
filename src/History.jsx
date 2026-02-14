import React, { useEffect, useState } from "react";

function History() {

    const [history, setHistory] = useState([]);

    useEffect(() => {

        fetch("http://127.0.0.1:4000/history")
            .then(res => res.json())
            .then(data => {
                setHistory(data);
            })
            .catch(err => {
                console.error("Error fetching history:", err);
            });

    }, []);

    return (

        <div style={{ padding: "20px" }}>

            <h2>Prediction History</h2>

            <table border="1" cellPadding="10">

                <thead>
                    <tr>
                        <th>Physics</th>
                        <th>Chemistry</th>
                        <th>Maths</th>
                        <th>Total</th>
                        <th>Rank</th>
                        <th>Date</th>
                    </tr>
                </thead>

                <tbody>

                    {history.map((item) => (

                        <tr key={item.id}>
                            <td>{item.physics}</td>
                            <td>{item.chemistry}</td>
                            <td>{item.maths}</td>
                            <td>{item.total}</td>
                            <td>{item.predicted_rank}</td>
                            <td>{item.created_at}</td>
                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default History;
