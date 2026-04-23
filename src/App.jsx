import { useState, useEffect } from "react";
import GroqChat from "./GroqChat";
import "./App.css";

const crearChat = (id) => ({
  id,
  titulo: "Nuevo chat",
  mensajes: [],
});

const cargarChatsIniciales = () => {
  try {
    const guardados = localStorage.getItem("chats");
    if (guardados) {
      const parsed = JSON.parse(guardados);
      // Filtramos chats vacíos al cargar
      const conMensajes = parsed.filter(c => c.mensajes.length > 0);
      if (conMensajes.length > 0) return conMensajes;
    }
  } catch (e) {
    console.error("Error al leer localStorage:", e);
  }
  return [crearChat(Date.now())];
};

const cargarChatActivoInicial = (chats) => {
  try {
    const guardado = localStorage.getItem("chatActivoId");
    if (guardado && chats.find((c) => c.id === Number(guardado))) {
      return Number(guardado);
    }
  } catch (e) {
    console.error("Error al leer chatActivoId:", e);
  }
  return chats[0].id;
};

export default function App() {
  const [chats, setChats] = useState(cargarChatsIniciales);
  const [chatActivoId, setChatActivoId] = useState(() =>
      cargarChatActivoInicial(cargarChatsIniciales())
  );
  const [chatAEliminar, setChatAEliminar] = useState(null);
  const [tema, setTema] = useState(() => {
    return localStorage.getItem("tema") || "oscuro";
  });

  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState("");

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("chatActivoId", chatActivoId);
  }, [chatActivoId]);

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem("tema", tema);
  }, [tema]);

  const chatActivo = chats.find((c) => c.id === chatActivoId) || chats[0];

  const chatsFiltrados = chats.filter(c => {
    const texto = textoBusqueda.toLowerCase();
    // Busca en el título
    const enTitulo = c.titulo.toLowerCase().includes(texto);
    // Busca en el contenido de los mensajes
    const enMensajes = c.mensajes.some(m =>
        m.content.toLowerCase().includes(texto)
    );
    return enTitulo || enMensajes;
  });

  const handleNuevoChat = () => {
    // Si el chat activo ya está vacío, no crear otro
    if (chatActivo && chatActivo.mensajes.length === 0) return;
    const nuevo = crearChat(Date.now());
    setChats((prev) => [...prev, nuevo]);
    setChatActivoId(nuevo.id);
  };

  const handleCambiarChat = (id) => {
    // Elimina chats vacíos excepto el que vamos a activar
    setChats(prev => prev.filter(c => c.mensajes.length > 0 || c.id === id));
    setChatActivoId(id);
  };

  const handleEliminarChat = (id) => {
    setChatAEliminar(id);
  };

  const confirmarEliminar = () => {
    const restantes = chats.filter((c) => c.id !== chatAEliminar);

    if (restantes.length === 0) {
      const nuevo = crearChat(Date.now());
      setChats([nuevo]);
      setChatActivoId(nuevo.id);
    } else {
      setChats(restantes);
      if (chatAEliminar === chatActivoId) {
        setChatActivoId(restantes[0].id);
      }
    }

    setChatAEliminar(null);
  };

  const handleActualizarMensajes = (nuevosMensajes) => {
    setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatActivoId) return c;

          const titulo =
              c.titulo === "Nuevo chat" && nuevosMensajes.length > 0
                  ? nuevosMensajes[0].content.slice(0, 28) + "..."
                  : c.titulo;

          return { ...c, mensajes: nuevosMensajes, titulo };
        })
    );
  };

  const handleToggleTema = () => {
    setTema((prev) => (prev === "oscuro" ? "claro" : "oscuro"));
  };

  return (
      <div className="app-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">ChatGroq</span>
            <button className="btn-tema-sidebar" onClick={handleToggleTema}>
              {tema === "oscuro" ? "☀️" : "🌙"}
            </button>
          </div>

          <div className="sidebar-actions">
            <button className="btn-nuevo-chat" onClick={handleNuevoChat}>
              + Nuevo chat
            </button>
            <button className="btn-buscar-icon" onClick={() => {
              setMostrarBusqueda(true);
              setTextoBusqueda("");
            }}>
              🔍 Buscar chat
            </button>
          </div>

          <ul className="chat-list">
            {chats.map((chat) => (
                <li
                    key={chat.id}
                    className={`chat-list-item ${chat.id === chatActivoId ? "activo" : ""}`}
                    onClick={() => handleCambiarChat(chat.id)}
                >
                  <span className="chat-titulo">{chat.titulo}</span>
                  <button
                      className="btn-eliminar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarChat(chat.id);
                      }}
                  >
                    ✕
                  </button>
                </li>
            ))}
          </ul>
        </aside>

        {/* CHAT PRINCIPAL */}
        <main className="main-content">
          <GroqChat
              key={chatActivo.id}
              mensajesIniciales={chatActivo.mensajes}
              onActualizarMensajes={handleActualizarMensajes}
              tema={tema}
              onToggleTema={handleToggleTema}
              tituloChatActivo={chatActivo?.titulo || "Nuevo chat"}
          />
        </main>

        {/* MODAL ELIMINAR */}
        {chatAEliminar && (
            <div className="modal-overlay">
              <div className="modal">
                <p>¿Seguro que quieres eliminar este chat?</p>
                <div className="modal-botones">
                  <button className="modal-btn cancelar" onClick={() => setChatAEliminar(null)}>
                    Cancelar
                  </button>
                  <button className="modal-btn eliminar" onClick={confirmarEliminar}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* MODAL BÚSQUEDA */}
        {mostrarBusqueda && (
            <div className="modal-overlay" onClick={() => setMostrarBusqueda(false)}>
              <div className="modal-busqueda" onClick={(e) => e.stopPropagation()}>
                <div className="busqueda-input-wrapper">
                  <span className="busqueda-icon">🔍</span>
                  <input
                      className="busqueda-input"
                      type="text"
                      placeholder="Buscar chat..."
                      value={textoBusqueda}
                      onChange={(e) => setTextoBusqueda(e.target.value)}
                      autoFocus
                  />
                  <button className="busqueda-cerrar" onClick={() => setMostrarBusqueda(false)}>✕</button>
                </div>

                <ul className="busqueda-resultados">
                  {chatsFiltrados.length > 0 ? (
                      chatsFiltrados.map(chat => (
                          <li
                              key={chat.id}
                              className="busqueda-item"
                              onClick={() => {
                                handleCambiarChat(chat.id);
                                setMostrarBusqueda(false);
                              }}
                          >
                            <span className="busqueda-item-icon">💬</span>
                            <span className="busqueda-item-titulo">{chat.titulo}</span>
                          </li>
                      ))
                  ) : (
                      <li className="busqueda-vacio">No se encontraron chats</li>
                  )}
                </ul>
              </div>
            </div>
        )}
      </div>
  );
}