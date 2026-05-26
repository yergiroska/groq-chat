import { db } from "./firebase";
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy,
} from "firebase/firestore";

// Obtener todos los chats de un usuario
export const obtenerChats = async (userId) => {
    const chatsRef = collection(db, "users", userId, "chats");
    const q = query(chatsRef, orderBy("creadoEn", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
};

// Guardar o actualizar un chat
export const guardarChat = async (userId, chat) => {
    const chatRef = doc(db, "users", userId, "chats", String(chat.id));
    await setDoc(chatRef, {
        id: String(chat.id),
        titulo: chat.titulo,
        mensajes: chat.mensajes,
        creadoEn: chat.creadoEn || Date.now(),
    });
};

// Eliminar un chat
export const eliminarChat = async (userId, chatId) => {
    const chatRef = doc(db, "users", userId, "chats", String(chatId));
    await deleteDoc(chatRef);
};