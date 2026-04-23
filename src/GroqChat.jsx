import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./GroqChat.css";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function GroqChat({ mensajesIniciales = [], onActualizarMensajes, tema, onToggleTema, tituloChatActivo }) {
    const [mensaje, setMensaje] = useState("");
    const [mensajes, setMensajes] = useState(mensajesIniciales);
    const [cargando, setCargando] = useState(false);
    const [streaming, setStreaming] = useState(false);
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
        onActualizarMensajes(nuevosMensajes);
        setMensaje("");
        setCargando(true);

        // Agregamos un mensaje vacío de la IA que iremos llenando
        const mensajesConRespuesta = [
            ...nuevosMensajes,
            { role: "assistant", content: "" },
        ];
        setMensajes(mensajesConRespuesta);

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
                    stream: true, // activamos streaming
                }),
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let textoCompleto = "";
            setStreaming(true);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decodificamos el trozo recibido
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter(line => line.trim() !== "");

                for (const line of lines) {
                    if (line === "data: [DONE]") break;
                    if (!line.startsWith("data: ")) continue;

                    try {
                        const json = JSON.parse(line.replace("data: ", ""));
                        const delta = json.choices?.[0]?.delta?.content;

                        if (delta) {
                            textoCompleto += delta;

                            // Actualizamos el último mensaje con el texto acumulado
                            setMensajes(prev => {
                                const actualizados = [...prev];
                                actualizados[actualizados.length - 1] = {
                                    role: "assistant",
                                    content: textoCompleto,
                                };
                                return actualizados;
                            });
                        }
                    } catch (e) {
                        // Ignoramos líneas que no son JSON válido
                    }
                }
            }

            // Guardamos el mensaje final en App
            const mensajesFinales = [
                ...nuevosMensajes,
                { role: "assistant", content: textoCompleto },
            ];
            setStreaming(false);
            onActualizarMensajes(mensajesFinales);

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
                <span className="chat-header-title">{tituloChatActivo}</span>
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
                            ) : streaming && index === mensajes.length - 1 ? (
                                <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                            ) : (
                                <ReactMarkdown
                                    components={{
                                        p: ({ node, ...props }) => (
                                            <p style={{ margin: "4px 0" }} {...props} />
                                        ),
                                        li: ({ node, children, ...props }) => (
                                            <li style={{ marginBottom: "2px" }} {...props}>
                                                {children}
                                            </li>
                                        ),
                                        h1: ({ node, ...props }) => (
                                            <h1 style={{ margin: "8px 0 4px" }} {...props} />
                                        ),
                                        h2: ({ node, ...props }) => (
                                            <h2 style={{ margin: "8px 0 4px" }} {...props} />
                                        ),
                                        h3: ({ node, ...props }) => (
                                            <h3 style={{ margin: "6px 0 2px" }} {...props} />
                                        ),
                                        ul: ({ node, ...props }) => (
                                            <ul style={{ margin: "2px 0", paddingLeft: "20px" }} {...props} />
                                        ),
                                        ol: ({ node, ...props }) => (
                                            <ol style={{ margin: "2px 0", paddingLeft: "20px" }} {...props} />
                                        ),
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
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