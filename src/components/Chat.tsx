import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

const SOCKET_SERVER_URL = "server-production-3253.up.railway.app";

interface Message {
  author: string;
  message: string;
}

interface HostInfo {
  host: string;
  ip: string;
}

export const Chat: React.FC = () => {
  const [nickname, setNickname] = useState<string>("");
  const [tempNick, setTempNick] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [hostInfo, setHostInfo] = useState<HostInfo>({
    host: "",
    ip: "0",
  });
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!nickname) return;

    // Crear coneccion al socket
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on("host_info", (info: HostInfo) => {
      setHostInfo(info);
      setConnected(true);
    });

    socketRef.current.on("receive_message", (msg: Message) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [nickname]);

  const handleNickname = () => {
    const nick = tempNick.trim();
    if (!nick) return;
    setNickname(nick);
  };
  const sendMessage = () => {
    if (!message.trim() || !connected) return;

    const msg: Message = { author: nickname, message: message };
    socketRef.current.emit("send_message", msg);
    setMessages((prevMessages) => [...prevMessages, msg]);
    setMessage("");
  };

  if (!nickname) {
    return (
      <div className="app">
        <Card title="Bienvenido">
          <div className="p-fluid">
            <div className="p-field">
              <label htmlFor="txtNick">Ingrese su nick:</label>
              <InputText
                id="txtNick"
                placeholder="Ejm. Jperez12"
                value={tempNick}
                onChange={(e) => setTempNick(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNickname();
                }}
              />
            </div>
            <Button
              label="Ingresar al chat"
              icon="pi pi-check"
              onClick={handleNickname}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="app">
      <Card title={`Chat de ${nickname}`}>
        <div className="host-info">
          Conectado desde: <strong>{hostInfo.host}</strong> - IP:{" "}
          <strong>{hostInfo.ip}</strong>
        </div>
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.author === nickname ? "my-message" : ""
              }`}
            >
              <strong>{msg.author}: </strong>
              {msg.message}
            </div>
          ))}
        </div>
      </Card>
      <div className="message-input">
        <InputText
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Escribe un mensaje..."
        />
        <Button
          label="Enviar"
          icon="pi pi-send"
          onClick={sendMessage}
          
        />
      </div>
    </div>
  );
};