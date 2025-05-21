// Este archivo es una copia temporal para guardar los cambios
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinRoomModal } from "./JoinRoomModal";
import { ChatRoom } from "./ChatRoom";
import {
  showSuccessMessage,
  showErrorMessage,
} from "./SuccessToast";

const SOCKET_SERVER_URL = "server-production-3253.up.railway.app";

interface Room {
  code: string;
  name: string;
  userCount: number;
  maxUsers: number;
}

interface HostInfo {
  host: string;
  ip: string;
}

interface RoomHistoryData {
  messages: {
    id: string;
    text: string;
    username: string;
    timestamp: string;
  }[];
  users: { username: string; id: string }[];
}

export const Home: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostInfo, setHostInfo] = useState<HostInfo | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "chat">("home");
  const [username, setUsername] = useState<string>("");
  const [messageHistory, setMessageHistory] = useState<RoomHistoryData>({
    messages: [],
    users: [],
  });
  const socketRef = useRef<any>(null);
  const toastRef = useRef<Toast>(null);

  // Variable de control para evitar múltiples uniones a sala
  const joinInProgress = useRef<boolean>(false);

  useEffect(() => {
    // Conectar al socket automáticamente
    socketRef.current = io(SOCKET_SERVER_URL);
    console.log("Iniciando conexión a:", SOCKET_SERVER_URL);

    socketRef.current.on("connect", () => {
      console.log("Conexión establecida con el servidor");
    });

    socketRef.current.on("connection_rejected", (data: { message: string }) => {
            console.log("Conexión rechazada:", data.message);
            setRejectionMessage(data.message);
            setConnected(false);
        });

    socketRef.current.on("host_info", (info: HostInfo) => {
      console.log("Evento host_info recibido:", info);
      setHostInfo(info);
      setConnected(true);
    });

    // Escuchar el evento de salas disponibles
    socketRef.current.on("available_rooms", (availableRooms: Room[]) => {
      console.log("Salas disponibles:", availableRooms);
      setRooms(availableRooms);
    });

    // Escuchar evento de sala creada exitosamente (notificación general)
    socketRef.current.on(
      "room_created",
      ({ roomCode }: { roomCode: string }) => {
        console.log("Sala creada con código:", roomCode);
        showSuccessMessage(
          toastRef,
          "Sala Creada",
          `Se ha creado la sala exitosamente con código: ${roomCode}`
        );
      }
    );

    // Escuchar evento de error al crear sala (nombre duplicado u otro)
    socketRef.current.on("join_room_error", (data: { message: string }) => {
      showErrorMessage(toastRef, "Error", data.message);
      joinInProgress.current = false;
    });

    // Escuchar evento de error usuario ya en sala
    socketRef.current.on("user_already_in_room", (data: { message: string }) => {
      console.log("Error:", data.message);
      showErrorMessage(toastRef, "Error", data.message);
      joinInProgress.current = false;
    });

    // Escuchar evento de actualización de lista de salas
    socketRef.current.on("room_list_updated", () => {
      console.log("Lista de salas actualizada, solicitando datos nuevos");
      // Solicitar la lista actualizada de salas
      socketRef.current.emit("get_rooms");
    });

    // Escuchar evento de error al unirse a una sala
    socketRef.current.on("join_room_error", (data: { message: string }) => {
      console.log("Error al unirse a la sala:", data.message);
      showErrorMessage(toastRef, "Error", data.message);
      joinInProgress.current = false;
    });

    socketRef.current.on("user_joined", ({ user, userCount, roomCode }: { user: { username: string; id: string }; userCount: number, roomCode: string }) => {
            console.log(`Usuario ${user.username} se unió a la sala. Total usuarios: ${userCount}`);
            setCurrentView("chat");
            setSelectedRoom((prev) => {
                if (prev && prev.code === roomCode) {
                    return { ...prev, userCount };
                }
                return prev;
            });
        });

        socketRef.current.on("user_left", ({ username, userCount, roomCode }: { userId: number; username: string; userCount: number, roomCode: string }) => {
            console.log(`Usuario ${username} se abandonó a la sala. Total usuarios: ${userCount}`);
            setCurrentView("chat");
            setSelectedRoom((prev) => {
                if (prev && prev.code === roomCode) {
                    return { ...prev, userCount };
                }
                return prev;
            });
        });


    return () => {
      // Solo desconectar si no estamos en proceso de unión a una sala
      if (socketRef.current && !joinInProgress.current) {
        console.log("Desconectando socket al desmontar");
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Función para crear una nueva sala
  const handleCreateRoom = (
    roomName: string,
    maxUsers: number,
    username: string
  ) => {
    // Verificar si ya existe una sala con el mismo nombre
    const roomExists = rooms.some((room) => room.name.trim().toLowerCase() === roomName.trim().toLowerCase());
    if (roomExists) {
      showErrorMessage(
        toastRef,
        "Error",
        `Ya existe una sala con el nombre "${roomName}". Elige otro nombre.`
      );
      return;
    }
    // Validar longitud de username
    if (username.trim().length > 10) {
      showErrorMessage(
        toastRef,
        "Error",
        "El nombre de usuario no puede tener más de 10 caracteres."
      );
      return;
    }
    if (socketRef.current && connected && !joinInProgress.current) {
      console.log(
        "Creando sala:",
        roomName,
        "con máximo de usuarios:",
        maxUsers,
        "y usuario:",
        username
      );
      // Marcar que estamos en proceso de unión
      joinInProgress.current = true;

      // Guardar el nombre de usuario
      setUsername(username);

      // Eliminar listeners previos para evitar duplicados
      socketRef.current.off("room_created");

      // Crear un nuevo listener que se ejecute solo una vez
      socketRef.current.once(
        "room_created",
        ({ roomCode }: { roomCode: string }) => {
          console.log(
            "Sala creada con código:",
            roomCode,
            "uniéndose automáticamente..."
          );

          // Crear objeto de sala con los datos que ya conocemos
          const newRoom: Room = {
            code: roomCode,
            name: roomName,
            userCount: 0,
            maxUsers,
          };

          // Actualizar el estado con la nueva sala
          setSelectedRoom(newRoom);

          // Pequeño retraso para asegurar que el servidor haya registrado la sala
          setTimeout(() => {
            // Unirse a la sala
            socketRef.current.emit("join_room", { roomCode, username });
            setCurrentView("chat"); // Forzar vista chat por si no llega room_history
          }, 500);
        }
      );

      // Emitir evento para crear sala
      socketRef.current.emit("create_room", { roomName, maxUsers });
      setShowCreateModal(false);
    } else {
      console.log(
        "No se puede crear sala: Socket no disponible o ya hay una unión en progreso"
      );
    }
  };

  // Función para intentar unirse a una sala
  const handleJoinRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setShowJoinModal(true);
  };

  // Función para unirse a una sala
  const handleJoinRoom = (username: string, roomCode: string) => {
    // Validar longitud de username
    if (username.trim().length > 10) {
      showErrorMessage(
        toastRef,
        "Error",
        "El nombre de usuario no puede tener más de 10 caracteres."
      );
      return;
    }
    if (socketRef.current && connected && !joinInProgress.current) {
      if (roomCode !== selectedRoom?.code) {
        console.log("Código de sala no coincide con el seleccionado");
        showErrorMessage(
          toastRef,
          "Error",
          "El código de sala no coincide con el seleccionado"
        );
        return;
      }

      console.log("Uniéndose a la sala:", roomCode, "con usuario:", username);
      joinInProgress.current = true;
      setUsername(username);

      // IMPORTANTE: Configura el listener ANTES de emitir join_room
      socketRef.current.once("room_history", (data: RoomHistoryData) => {
        console.log("Historial recibido:", data);
        setMessageHistory(data);
        setCurrentView("chat");
        joinInProgress.current = false; // Permitir nuevas uniones
      });

      socketRef.current.emit("join_room", { roomCode, username });
      setShowJoinModal(false);
      
    }
  };

  // Función para salir de una sala
  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave_room");
      setCurrentView("home");
      setSelectedRoom(null);
      setUsername("");
      setMessageHistory({ messages: [], users: [] }); // Limpiar historial
      joinInProgress.current = false; // Resetear unión
    }
  };

  // Modal que no se puede cerrar si hay rechazo de conexión
  const renderRejectionModal = () => {
    return (
      <Dialog
        header="Conexión Rechazada"
        visible={rejectionMessage !== null}
        closable={false}
        style={{ width: "50vw" }}
        onHide={() => {}}
      >
        <p className="m-0">{rejectionMessage}</p>
      </Dialog>
    );
  };

  if (selectedRoom && currentView === "chat") {
    return (
      <ChatRoom
        username={username}
        roomCode={selectedRoom.code}
        roomName={selectedRoom.name}
        messageHistory={messageHistory}
        onLeaveRoom={handleLeaveRoom}
        socket={socketRef.current}
      />
    );
  }

  return (
    <div className="app-container">
      <header className="chat-header">
        <div className="header-left">
          <h1>Chat EPAA</h1>
        </div>
        {hostInfo && (
          <div className="header-right">
            <p>
              Conectado desde: <strong>{hostInfo.host}</strong> - IP:{" "}
              <strong>{hostInfo.ip}</strong>
            </p>
          </div>
        )}
      </header>

      <main className="chat-main">
        <div className="rooms-header">
          <h2>Salas de Chat Disponibles</h2>
          <Button
            label="Crear Nueva Sala"
            icon="pi pi-plus"
            onClick={() => setShowCreateModal(true)}
            disabled={!connected}
            className="p-button-success"
          />
        </div>

        <Card className="rooms-card">
          {rooms.length > 0 ? (
            <DataTable value={rooms} paginator rows={5}>
              <Column field="name" header="Nombre de la Sala" />
              <Column
                field="userCount"
                header="Usuarios"
                body={(room) => `${room.userCount}/${room.maxUsers}`}
              />
              <Column
                body={(room) => (
                  <Button
                    label="Unirse"
                    icon="pi pi-sign-in"
                    onClick={() => handleJoinRoomClick(room)}
                    disabled={!connected || room.userCount >= room.maxUsers}
                  />
                )}
              />
            </DataTable>
          ) : (
            <div className="no-rooms">
              <p>No hay salas disponibles en este momento.</p>
            </div>
          )}
        </Card>

        {/* Modal de creación de sala */}
        <CreateRoomModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateRoom={handleCreateRoom}
        />

        {/* Modal para unirse a una sala */}
        {selectedRoom && (
          <JoinRoomModal
            visible={showJoinModal}
            roomCode={selectedRoom.code}
            roomName={selectedRoom.name}
            onClose={() => setShowJoinModal(false)}
            onJoinRoom={handleJoinRoom}
          />
        )}

        {/* Modal de rechazo de conexión */}
        {renderRejectionModal()}

        {/* Toast para mensajes de éxito */}
        <Toast ref={toastRef} position="top-right" />
      </main>
    </div>
  );
};
