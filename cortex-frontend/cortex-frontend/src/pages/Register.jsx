import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./login.css";

function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const register = async () => {
        setError("");
        setLoading(true);
        try {
            await api.post("/auth/register", { email, password });
            navigate("/");
        } catch (err) {
            setError("Registration failed. Try a different email.");
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") register();
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">⬡</div>
                <h1 className="auth-title">Cortex</h1>
                <p className="auth-subtitle">Create your account</p>

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
                        autoComplete="new-password"
                    />
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button className="auth-btn-primary" onClick={register} disabled={loading}>
                    {loading && <span className="auth-spinner" />}
                    {loading ? "Creating account…" : "Create Account"}
                </button>

                <div className="auth-divider"><span>or</span></div>

                <button className="auth-btn-ghost" onClick={() => navigate("/")}>
                    Sign in instead
                </button>
            </div>
        </div>
    );
}

export default Register;