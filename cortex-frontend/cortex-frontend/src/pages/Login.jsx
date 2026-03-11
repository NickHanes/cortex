import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import "./login.css";

function Login() {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            const response = await api.post("/auth/login", { email, password });
            login(response.data);
            localStorage.removeItem("cortex-session-started");
            navigate("/dashboard");
        } catch (err) {
            setError("Invalid email or password");
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">⬡</div>
                <h1 className="auth-title">Cortex</h1>
                <p className="auth-subtitle">AI Study Platform</p>

                <div className="auth-fields">
                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="email"
                    />
                    <input
                        className="auth-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="current-password"
                    />
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button className="auth-btn-primary" onClick={handleLogin} disabled={loading}>
                    {loading ? <span className="auth-spinner" /> : null}
                    {loading ? "Signing in…" : "Sign In"}
                </button>

                <div className="auth-divider"><span>or</span></div>

                <button className="auth-btn-ghost" onClick={() => navigate("/register")}>
                    Create an account
                </button>
            </div>
        </div>
    );
}

export default Login;