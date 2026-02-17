import { useState } from "react";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin() {

        try {

            const response = await fetch("http://localhost:4000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {

                localStorage.setItem("token", data.token);
                window.location.reload();

            } else {

                alert(data.error);

            }

        } catch (error) {

            alert("Login failed");

        }

    }

    return (

        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(135deg, #0f172a, #020617)"
        }}>

            <div style={{
                width: "350px",
                padding: "40px",
                background: "#0f172a",
                borderRadius: "12px",
                boxShadow: "0 15px 40px rgba(0,0,0,0.7)",
                textAlign: "center"
            }}>

                <h2 style={{
                    color: "white",
                    marginBottom: "20px"
                }}>
                    ExamRank Login
                </h2>

                <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                />

                <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                />

                <button
                    onClick={handleLogin}
                    style={buttonStyle}
                >
                    Login
                </button>

            </div>

        </div>

    );

}

const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "none",
    background: "#020617",
    color: "white"
};

const buttonStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
};

export default Login;
