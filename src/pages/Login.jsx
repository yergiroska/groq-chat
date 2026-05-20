import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../Auth.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setCargando(true);
        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            setError("Email o contraseña incorrectos");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-logo">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                        <circle cx="16" cy="16" r="15" fill="#2f6feb" />
                        <path d="M18 4L8 18h8l-2 10 14-16h-8l2-8z" fill="white" />
                    </svg>
                    <span>Destello</span>
                </div>
                <h2>Iniciar sesión</h2>
                {error && <p className="auth-error">{error}</p>}
                <form onSubmit={handleLogin} className="auth-form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-input"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-input"
                        required
                    />
                    <button type="submit" className="auth-btn" disabled={cargando}>
                        {cargando ? "Entrando..." : "Entrar"}
                    </button>
                </form>
                <p className="auth-link">
                    ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
                </p>
            </div>
        </div>
    );
}