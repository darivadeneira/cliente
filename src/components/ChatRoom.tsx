// Este archivo es una copia temporal para guardar los cambios
import React, { useEffect, useRef, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

interface RoomHistoryData {
  messages: {
    id: string;
    text: string;
    username: string;
    timestamp: string;
  }[];
  users: { username: string; id: string }[];
}

interface ChatRoomProps {
  username: string;
  roomCode: string;
  roomName: string;
  messageHistory: RoomHistoryData;
  onLeaveRoom: () => void;
  socket: any;
}

interface Message {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  username,
  roomCode,
  roomName,
  messageHistory,
  onLeaveRoom,
  socket,
}) => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cargar el historial inicial
  useEffect(() => {
    if (messageHistory && messageHistory.messages) {
      console.log(
        "Cargando historial inicial:",
        messageHistory.messages.length,
        "mensajes"
      );
      setMessages(messageHistory.messages);
      setTimeout(scrollToBottom, 200);
    }
  }, [messageHistory]);

  // Configurar el socket y escuchar nuevos mensajes
  useEffect(() => {
    socketRef.current = socket;

    // Escuchar mensajes entrantes
    socketRef.current.on("receive_message", (messageData: Message) => {
      console.log("Mensaje recibido:", messageData);
      setMessages((prev) => [...prev, messageData]);
      setTimeout(scrollToBottom, 100); // Pequeño retraso para asegurar el scroll
    });

    // Escuchar cuando un usuario se une a la sala
    socketRef.current.on("user_joined", (data: { user: { username: string; id: string } }) => {
      const joinMsg: Message = {
        id: `join-${data.user.id}-${Date.now()}`,
        text: `se unió al chat`,
        username: data.user.username,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, joinMsg]);
      setTimeout(scrollToBottom, 100);
    });

    // Escuchar cuando un usuario abandona la sala
    socketRef.current.on("user_left", (data: { username: string; userId: string }) => {
      const leftMsg: Message = {
        id: `left-${data.userId}-${Date.now()}`,
        text: `salió del chat`,
        username: data.username,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, leftMsg]);
      setTimeout(scrollToBottom, 100);
    });

    // Limpieza al desmontar
    return () => {
      socketRef.current.off("receive_message");
      socketRef.current.off("user_joined");
      socketRef.current.off("user_left");
    };
  }, [socket]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Enviamos el mensaje en el formato que espera el servidor
    socketRef.current.emit("send_message", { text: message.trim() });
    setMessage("");
  };

  // Formatear la hora del mensaje
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="app-container">
      <header className="chat-header">
        <div className="header-left">
          <h1>Chat EPAA - Sala: {roomName}</h1>
        </div>
        <div className="header-right">
          <p>
            Usuario: <strong>{username}</strong> | Código:{" "}
            <strong>{roomCode}</strong>
          </p>
          <Button
            label="Salir"
            icon="pi pi-sign-out"
            className="p-button-sm p-button-danger"
            onClick={onLeaveRoom}
          />
        </div>
      </header>

      <main className="chat-main">
        <Card className="chat-messages-card">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-message-placeholder">
                <p>Aún no hay mensajes en esta sala.</p>
                <p>¡Sé el primero en escribir algo!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${
                    msg.username === username ? "my-message" : ""
                  } ${msg.text === "se unió al chat" ? "join-message" : ""} ${msg.text === "salió del chat" ? "left-message" : ""}`}
                >
                  {msg.text === "se unió al chat" ? (
                    <em>🟢 <strong>{msg.username}</strong> se unió al chat</em>
                  ) : msg.text === "salió del chat" ? (
                    <em>🔴 <strong>{msg.username}</strong> salió del chat</em>
                  ) : (
                    <>
                      <strong>{msg.username}: </strong>
                      {msg.text}
                      <span className="message-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>

        <div className="chat-input-container">
          <InputText
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="chat-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
          <Button
            icon="pi pi-send"
            onClick={handleSendMessage}
            className="send-button"
          />
        </div>
      </main>
    </div>
  );
};
