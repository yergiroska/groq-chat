# 🤖 ChatGroq

ChatBot conversacional construido con React y la API de Groq, inspirado en la interfaz de ChatGPT.

## 🚀 Demo

> Próximamente

## ✨ Características

- 💬 Chat conversacional con historial de mensajes
- 🗂️ Múltiples chats simultáneos con títulos automáticos
- 💾 Persistencia de chats con localStorage
- 🌙 Modo oscuro y claro
- ✍️ Renderizado de Markdown en las respuestas
- ⌨️ Indicador "Escribiendo..." animado
- 📱 Envío de mensajes con Enter
- 🗑️ Eliminar chats con confirmación
- 🔐 API Key protegida con variables de entorno

## 🛠️ Tecnologías

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Groq API](https://console.groq.com/) — modelo `llama-3.1-8b-instant`
- [react-markdown](https://github.com/remarkjs/react-markdown)
- CSS personalizado (sin librerías de UI)

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/yergiroska/groq-chat.git
cd groq-chat
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto: VITE_GROQ_API_KEY=tu_api_key_aqui.

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## 🔑 Obtener API Key de Groq

1. Ve a [console.groq.com](https://console.groq.com/)
2. Crea una cuenta gratuita
3. Ve a **API Keys** y genera una nueva key
4. Cópiala en tu archivo `.env`

## 📁 Estructura del proyecto
```
src/
├── App.jsx          # Maneja lista de chats y sidebar
├── App.css          # Estilos del layout general
├── GroqChat.jsx     # Maneja mensajes y llamada a la API
└── GroqChat.css     # Estilos del chat
```
## 🗺️ Roadmap

- [ ] Streaming de respuestas
- [ ] Exportar chats
- [ ] Soporte para imágenes
- [ ] Deploy en Vercel

## 👤 Autor

**yergiroska** — [@yergiroska](https://github.com/yergiroska)

---

⭐ Si te gustó el proyecto, dale una estrella en GitHub.