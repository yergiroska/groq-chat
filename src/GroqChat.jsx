import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./GroqChat.css";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function GroqChat({ mensajesIniciales = [], onActualizarMensajes, tituloChatActivo, onAbrirSidebar }) {
    const [mensaje, setMensaje] = useState("");
    const [mensajes, setMensajes] = useState(() =>
        mensajesIniciales.map(m => m.id ? m : { ...m, id: crypto.randomUUID() })
    );
    const [cargando, setCargando] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const streamingMsgId = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes, cargando]);

    const enviarMensaje = async () => {
        if (!mensaje.trim() || cargando) return;

        const nuevosMensajes = [
            ...mensajes,
            { role: "user", content: mensaje, id: crypto.randomUUID() },
        ];

        setMensajes(nuevosMensajes);
        onActualizarMensajes(nuevosMensajes);
        setMensaje("");
        setCargando(true);

        const assistantId = crypto.randomUUID();
        streamingMsgId.current = assistantId;

        setMensajes([...nuevosMensajes, { role: "assistant", content: "", id: assistantId }]);

        try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: "Eres un asistente útil y amigable. Responde siempre en español, independientemente del idioma en que te escriban."
                        },
                        ...nuevosMensajes.map(({ role, content }) => ({ role, content })),
                    ],
                    stream: true,
                }),
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let textoCompleto = "";
            setStreaming(true);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

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

                            setMensajes(prev => {
                                const actualizados = [...prev];
                                actualizados[actualizados.length - 1] = {
                                    ...actualizados[actualizados.length - 1],
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

            const mensajesFinales = [
                ...nuevosMensajes,
                { role: "assistant", content: textoCompleto, id: assistantId },
            ];
            setStreaming(false);
            streamingMsgId.current = null;
            onActualizarMensajes(mensajesFinales);

        } catch (error) {
            console.error("Error al contactar la API:", error);
        } finally {
            setCargando(false);
            setStreaming(false);
            streamingMsgId.current = null;
        }
    };

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
                <button className="btn-menu-movil" onClick={onAbrirSidebar}>
                    ☰
                </button>
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

                {mensajes.map((msg) => (
                    <div
                        key={msg.id}
                        className={`chat-bubble-wrapper ${msg.role === "user" ? "user" : "ai"}`}
                    >
                        <div className={`chat-bubble ${msg.role === "user" ? "bubble-user" : "bubble-ai"}`}>
                            {msg.role === "user" ? (
                                msg.content
                            ) : streaming && msg.id === streamingMsgId.current ? (
                                <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                            ) : (
                                <ReactMarkdown
                                    components={{
                                        p: (props) => (
                                            <p style={{ margin: "4px 0" }} {...props} />
                                        ),
                                        li: ({ children, ...props }) => (
                                            <li style={{ marginBottom: "2px" }} {...props}>
                                                {children}
                                            </li>
                                        ),
                                        h1: (props) => (
                                            <h1 style={{ margin: "8px 0 4px" }} {...props} />
                                        ),
                                        h2: (props) => (
                                            <h2 style={{ margin: "8px 0 4px" }} {...props} />
                                        ),
                                        h3: (props) => (
                                            <h3 style={{ margin: "6px 0 2px" }} {...props} />
                                        ),
                                        ul: (props) => (
                                            <ul style={{ margin: "2px 0", paddingLeft: "20px" }} {...props} />
                                        ),
                                        ol: (props) => (
                                            <ol style={{ margin: "2px 0", paddingLeft: "20px" }} {...props} />
                                        ),
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            )}
                        </div>

                        {/* Botón copiar — solo en mensajes de la IA */}
                        {msg.role === "assistant" && (
                            <>
                                {/* Botón copiar — esquina superior derecha */}
                                <div className="bubble-copiar-top">
                                    <button
                                        className="btn-copiar"
                                        onClick={() => navigator.clipboard.writeText(msg.content)}
                                        title="Copiar respuesta"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>

                                {/* Barra de acciones — debajo a la izquierda */}
                                <div className="bubble-acciones">
                                    <button
                                        className="btn-copiar"
                                        onClick={() => navigator.clipboard.writeText(msg.content)}
                                        title="Copiar respuesta"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}

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
                    Destello puede cometer errores. Verifica la información importante.
                </p>
            </footer>

        </div>
    );
}