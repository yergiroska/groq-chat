import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../Auth.css";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const { registro } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        if (password !== confirmar) {
            return setError("Las contraseñas no coinciden");
        }
        if (password.length < 6) {
            return setError("La contraseña debe tener al menos 6 caracteres");
        }
        setCargando(true);
        try {
            await registro(email, password);
            navigate("/");
        } catch (err) {
            setError("Error al crear la cuenta. Intenta con otro email");
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
                <h2>Crear cuenta</h2>
                {error && <p className="auth-error">{error}</p>}
                <form onSubmit={handleRegister} className="auth-form">
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
                    <input
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                        className="auth-input"
                        required
                    />
                    <button type="submit" className="auth-btn" disabled={cargando}>
                        {cargando ? "Creando cuenta..." : "Crear cuenta"}
                    </button>
                </form>
                <p className="auth-link">
                    ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}