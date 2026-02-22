import { useState } from "react";

function Auth() {

    const [isLogin, setIsLogin] = useState(true);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    async function handleSubmit() {

        const url = isLogin
            ? `${API_URL}/auth/login`
            : `${API_URL}/auth/signup`;

        const body = isLogin
            ? { email, password }
            : { name, email, password };

        try {

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (res.ok) {

                if (isLogin) {

                    localStorage.setItem("token", data.token);
                    window.location.reload();

                } else {

                    alert("Signup successful. Please login.");
                    setIsLogin(true);

                }

            } else {

                alert(data.error || "Request failed");

            }

        } catch (error) {

            console.error("Auth error:", error);
            alert("Server error");

        }

    }

    return (

        <div style={containerStyle}>

            <div style={cardStyle}>

                <h2 style={{ color: "white", marginBottom: "20px" }}>
                    {isLogin ? "Login" : "Signup"}
                </h2>

                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Enter name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={inputStyle}
                    />
                )}

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
                    onClick={handleSubmit}
                    style={buttonStyle}
                >
                    {isLogin ? "Login" : "Signup"}
                </button>

                <p
                    onClick={() => setIsLogin(!isLogin)}
                    style={{
                        color: "#3b82f6",
                        cursor: "pointer",
                        marginTop: "15px"
                    }}
                >
                    {isLogin
                        ? "Don't have account? Signup"
                        : "Already have account? Login"}
                </p>

            </div>

        </div>

    );

}

const containerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #020617)"
};

const cardStyle = {
    width: "350px",
    padding: "40px",
    background: "#0f172a",
    borderRadius: "12px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.7)",
    textAlign: "center"
};

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

export default Auth;