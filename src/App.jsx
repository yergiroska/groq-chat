import { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import GroqChat from "./GroqChat";
import "./App.css";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { obtenerChats, guardarChat, eliminarChat } from "./services/chatService.js";

const crearChat = (id) => ({
  id,
  titulo: "Nuevo chat",
  mensajes: [],
  creadoEn: Date.now(),
});

export default function App() {
  const { usuario, logout } = useAuth();
  const [cargandoChats, setCargandoChats] = useState(true);
  const [chats, setChats] = useState([crearChat(Date.now())]);
  const [chatActivoId, setChatActivoId] = useState(null);
  const [chatAEliminar, setChatAEliminar] = useState(null);
  const [tema, setTema] = useState(() => {
    return localStorage.getItem("tema") || "oscuro";
  });
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [chatRenombrando, setChatRenombrando] = useState(null);
  const [nuevoTitulo, setNuevoTitulo] = useState("");

  // Cargar chats desde Firestore al iniciar
  useEffect(() => {
    if (!usuario) return;
    const cargar = async () => {
      setCargandoChats(true);
      try {
        const chatsCloud = await obtenerChats(usuario.uid);
        if (chatsCloud.length > 0) {
          setChats(chatsCloud);
          setChatActivoId(chatsCloud[chatsCloud.length - 1].id);
        } else {
          const nuevo = crearChat(Date.now());
          setChats([nuevo]);
          setChatActivoId(nuevo.id);
        }
      } catch (e) {
        console.error("Error al cargar chats:", e);
      } finally {
        setCargandoChats(false);
      }
    };
    cargar();
  }, [usuario]);

  // Guardar chats en Firestore cuando cambian
  useEffect(() => {
    if (!usuario || cargandoChats) return;
    chats.forEach((chat) => {
      guardarChat(usuario.uid, chat);
    });
  }, [chats, usuario]);

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem("tema", tema);
  }, [tema]);

  const chatActivo = chats.find((c) => c.id === chatActivoId) || chats[0];

  const chatsFiltrados = chats.filter(c => {
    const texto = textoBusqueda.toLowerCase();
    const enTitulo = c.titulo.toLowerCase().includes(texto);
    const enMensajes = c.mensajes.some(m =>
        m.content.toLowerCase().includes(texto)
    );
    return enTitulo || enMensajes;
  });

  const handleNuevoChat = () => {
    if (chatActivo && chatActivo.mensajes.length === 0) return;
    const nuevo = crearChat(Date.now());
    setChats((prev) => [...prev, nuevo]);
    setChatActivoId(nuevo.id);
  };

  const handleCambiarChat = (id) => {
    setChats(prev => prev.filter(c => c.mensajes.length > 0 || c.id === id));
    setChatActivoId(id);
  };

  const handleEliminarChat = (id) => {
    setChatAEliminar(id);
  };

  const confirmarEliminar = () => {
    if (usuario) {
      eliminarChat(usuario.uid, chatAEliminar);
    }
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

  const handleRenombrar = (id) => {
    const chat = chats.find(c => c.id === id);
    setChatRenombrando(id);
    setNuevoTitulo(chat.titulo.replace(/\.\.\.$/, ""));
    setMenuAbierto(null);
  };

  const confirmarRenombrar = () => {
    if (!nuevoTitulo.trim()) return;
    setChats(prev => prev.map(c =>
        c.id === chatRenombrando ? { ...c, titulo: nuevoTitulo.trim() } : c
    ));
    setChatRenombrando(null);
    setNuevoTitulo("");
  };

  const handleActualizarMensajes = (nuevosMensajes) => {
    setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatActivoId) return c;
          const raw = nuevosMensajes[0]?.content ?? "";
          const titulo =
              c.titulo === "Nuevo chat" && nuevosMensajes.length > 0
                  ? raw.length > 50 ? raw.slice(0, 50) + "..." : raw
                  : c.titulo;
          return { ...c, mensajes: nuevosMensajes, titulo };
        })
    );
  };

  const handleToggleTema = () => {
    setTema((prev) => (prev === "oscuro" ? "claro" : "oscuro"));
  };

  if (cargandoChats) {
    return (
        <div style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#212121",
          color: "#ececec",
          fontSize: "16px"
        }}>
          Cargando...
        </div>
    );
  }

  const mainApp = (
      <div className="app-layout">
        {sidebarAbierto && (
            <div className="sidebar-overlay" onClick={() => setSidebarAbierto(false)} />
        )}

        <aside className={`sidebar ${sidebarAbierto ? "sidebar-abierto" : ""}`}>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <svg className="sidebar-logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="15" fill="#2f6feb" />
                <path d="M18 4L8 18h8l-2 10 14-16h-8l2-8z" fill="white" />
              </svg>
              <span className="sidebar-title">Destello</span>
            </div>
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
                    onClick={() => {
                      handleCambiarChat(chat.id);
                      setSidebarAbierto(false);
                    }}
                >
                  <span className="chat-titulo">{chat.titulo}</span>

                  <button
                      className="btn-menu-chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAbierto(menuAbierto === chat.id ? null : chat.id);
                      }}
                  >
                    ⋮
                  </button>

                  {menuAbierto === chat.id && (
                      <div className="menu-chat" onClick={(e) => e.stopPropagation()}>
                        <button className="menu-chat-item" onClick={() => handleRenombrar(chat.id)}>
                          ✏️ Renombrar
                        </button>
                        <button className="menu-chat-item eliminar" onClick={() => {
                          setMenuAbierto(null);
                          handleEliminarChat(chat.id);
                        }}>
                          🗑️ Eliminar
                        </button>
                      </div>
                  )}
                </li>
            ))}
          </ul>

          {/* FOOTER DEL SIDEBAR */}
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {usuario?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="sidebar-email">{usuario?.email}</span>
            </div>
            <button className="btn-logout" onClick={logout} title="Cerrar sesión">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </aside>

        <main className="main-content">
          <GroqChat
              key={chatActivo.id}
              mensajesIniciales={chatActivo.mensajes}
              onActualizarMensajes={handleActualizarMensajes}
              tituloChatActivo={chatActivo?.titulo || "Nuevo chat"}
              onAbrirSidebar={() => setSidebarAbierto(true)}
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

        {chatRenombrando && (
            <div className="modal-overlay" onClick={() => setChatRenombrando(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <p>Renombrar chat</p>
                <input
                    className="modal-input"
                    type="text"
                    value={nuevoTitulo}
                    onChange={(e) => setNuevoTitulo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmarRenombrar()}
                    autoFocus
                />
                <div className="modal-botones">
                  <button className="modal-btn cancelar" onClick={() => setChatRenombrando(null)}>
                    Cancelar
                  </button>
                  <button className="modal-btn eliminar" onClick={confirmarRenombrar}
                          style={{ backgroundColor: "#2f6feb" }}>
                    Guardar
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );

  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>{mainApp}</PrivateRoute>
        } />
      </Routes>
  );
}