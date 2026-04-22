import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./GroqChat.css";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function GroqChat({ mensajesIniciales = [], onActualizarMensajes, tema, onToggleTema }) {
    const [mensaje, setMensaje] = useState("");
    const [mensajes, setMensajes] = useState(mensajesIniciales);
    const [cargando, setCargando] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes, cargando]);

    const enviarMensaje = async () => {
        if (!mensaje.trim() || cargando) return;

        const nuevosMensajes = [
            ...mensajes,
            { role: "user", content: mensaje },
        ];

        setMensajes(nuevosMensajes);
        onActualizarMensajes(nuevosMensajes); //  notifica a App
        setMensaje("");
        setCargando(true);

        try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: nuevosMensajes,
                }),
            });

            const data = await res.json();

            if (data.choices) {
                const respuestaIA = data.choices[0].message;
                const mensajesFinales = [...nuevosMensajes, respuestaIA];
                setMensajes(mensajesFinales);
                onActualizarMensajes(mensajesFinales); //  notifica a App con respuesta IA
            }
        } catch (error) {
            console.error("Error al contactar la API:", error);
        } finally {
            setCargando(false);
        }
    };

    // Enviar con Enter (sin Shift)
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    return (
        <div className="chat-container">

            {/* HEADER */}
            <header className="chat-header">
            <span className="chat-header-title">ChatGroq</span>
            <button className="btn-tema" onClick={onToggleTema}>
                {tema === "oscuro" ? "☀️" : "🌙"}
            </button>
        </header>

            {/* ÁREA DE MENSAJES */}
            <main className="chat-messages">
                {mensajes.length === 0 && (
                    <div className="chat-welcome">
                        <h1>¿En qué puedo ayudarte?</h1>
                        <p>Escribe un mensaje para comenzar</p>
                    </div>
                )}

                {mensajes.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat-bubble-wrapper ${msg.role === "user" ? "user" : "ai"}`}
                    >
                        <div className={`chat-bubble ${msg.role === "user" ? "bubble-user" : "bubble-ai"}`}>
                            {msg.role === "user" ? (
                                msg.content
                            ) : (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            )}
                        </div>
                    </div>
                ))}

                {/* Indicador "Escribiendo..." */}
                {cargando && (
                    <div className="chat-bubble-wrapper ai">
                        <div className="chat-bubble bubble-ai typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </main>

            {/* INPUT FIJO ABAJO */}
            <footer className="chat-footer">
                <div className="chat-input-wrapper">
                  <textarea
                      className="chat-input"
                      value={mensaje}
                      onChange={(e) => {
                          setMensaje(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe un mensaje..."
                      rows={1}
                  />
                  <button
                    className={`chat-send-btn ${!mensaje.trim() || cargando ? "disabled" : ""}`}
                    onClick={enviarMensaje}
                    disabled={!mensaje.trim() || cargando}
                  >
                    ➤
                  </button>
                </div>
                <p className="chat-disclaimer">
                    ChatGroq puede cometer errores. Verifica la información importante.
                </p>
            </footer>

        </div>
    );
}