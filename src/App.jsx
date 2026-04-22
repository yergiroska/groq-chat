import { useState, useEffect } from "react";
import GroqChat from "./GroqChat";
import "./App.css";

const crearChat = (id) => ({
  id,
  titulo: "Nuevo chat",
  mensajes: [],
});

// Lee los chats guardados, o crea uno nuevo si no hay nada
const cargarChatsIniciales = () => {
  try {
    const guardados = localStorage.getItem("chats");
    if (guardados) {
      const parsed = JSON.parse(guardados);
      if (parsed.length > 0) return parsed;
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

  // Guardar chats en localStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  // Guardar chat activo cada vez que cambia
  useEffect(() => {
    localStorage.setItem("chatActivoId", chatActivoId);
  }, [chatActivoId]);

  const chatActivo = chats.find((c) => c.id === chatActivoId);

  const [tema, setTema] = useState(() => {
    return localStorage.getItem("tema") || "oscuro";
  });

// Aplica la clase al body cuando cambia el tema
  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem("tema", tema);
  }, [tema]);

  const handleToggleTema = () => {
    setTema((prev) => (prev === "oscuro" ? "claro" : "oscuro"));
  };

  const handleNuevoChat = () => {
    const nuevo = crearChat(Date.now());
    setChats((prev) => [...prev, nuevo]);
    setChatActivoId(nuevo.id);
  };

  const handleEliminarChat = (id) => {
    setChatAEliminar(id);
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

  return (
      <div className="app-layout">
        <aside className="sidebar">
          <button className="btn-nuevo-chat" onClick={handleNuevoChat}>
            + Nuevo chat
          </button>

          <ul className="chat-list">
            {chats.map((chat) => (
                <li
                    key={chat.id}
                    className={`chat-list-item ${chat.id === chatActivoId ? "activo" : ""}`}
                    onClick={() => setChatActivoId(chat.id)}
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

        <main className="main-content">
          <GroqChat
              key={chatActivo.id}
              mensajesIniciales={chatActivo.mensajes}
              onActualizarMensajes={handleActualizarMensajes}
              tema={tema}
              onToggleTema={handleToggleTema}
          />
        </main>

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

      </div>
  );
}