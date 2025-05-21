import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

interface JoinRoomModalProps {
  visible: boolean;
  roomCode: string;
  roomName: string;
  onClose: () => void;
  onJoinRoom: (username: string, roomCode: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  visible,
  roomCode,
  roomName,
  onClose,
  onJoinRoom,
}) => {
  const [username, setUsername] = useState<string>("");
  const [inputRoomCode, setInputRoomCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleJoinRoom = () => {
    const trimmedUsername = username.trim();
    const trimmedRoomCode = inputRoomCode.trim();
    
    // Validar nombre de usuario
    if (!trimmedUsername) {
      setError("Por favor, ingresa un nombre de usuario");
      return;
    }
    
    // Validar código de sala
    if (!trimmedRoomCode) {
      setCodeError("Por favor, ingresa el código de la sala");
      return;
    }
    
    // Verificar si el código ingresado coincide con el código de la sala
    if (trimmedRoomCode !== roomCode) {
      setCodeError("El código ingresado no coincide con el código de la sala");
      return;
    }

    onJoinRoom(trimmedUsername, trimmedRoomCode);
    resetForm();
  };
  const resetForm = () => {
    setUsername("");
    setInputRoomCode("");
    setError(null);
    setCodeError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const footer = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={handleClose}
        className="p-button-text"
      />
      <Button
        label="Unirse"
        icon="pi pi-sign-in"
        onClick={handleJoinRoom}
        autoFocus
      />
    </div>
  );

  return (
    <Dialog
      header={`Unirse a la sala: ${roomName}`}
      visible={visible}
      style={{ width: "450px" }}
      footer={footer}
      onHide={handleClose}
      modal
    >      <div className="p-fluid">
        <div className="p-field mb-3">
          <label htmlFor="username" className="block mb-2">Nombre de Usuario</label>
          <InputText
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={error ? "p-invalid" : ""}
            aria-describedby="username-error"
            placeholder="Ej. Juan Pérez"
            autoFocus
          />
          {error && (
            <small id="username-error" className="p-error block mt-1">
              {error}
            </small>
          )}
        </div>

        <div className="p-field mb-3">
          <label htmlFor="roomCode" className="block mb-2">Código de Sala</label>
          <InputText
            id="roomCode"
            value={inputRoomCode}
            onChange={(e) => setInputRoomCode(e.target.value)}
            className={codeError ? "p-invalid" : ""}
            aria-describedby="roomcode-error"
            placeholder="Ingresa el código de la sala"
          />
          {codeError && (
            <small id="roomcode-error" className="p-error block mt-1">
              {codeError}
            </small>
          )}
        </div>

        <div className="room-info p-field">
          <label className="block mb-2">Información de la Sala</label>
          <div className="room-name p-2 bg-gray-100 border-round">
            <strong>Nombre: </strong>{roomName}
          </div>
          <div className="room-code p-2 bg-gray-100 border-round mt-2">
            <strong>Código de referencia: </strong>{"PPCP22"}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
