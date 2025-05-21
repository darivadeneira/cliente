import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

interface CreateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateRoom: (roomName: string, maxUsers: number, username: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  visible,
  onClose,
  onCreateRoom,
}) => {
  const [roomName, setRoomName] = useState<string>("");
  const [maxUsers, setMaxUsers] = useState<number>(10);
  const [username, setUsername] = useState<string>("");
  const [errors, setErrors] = useState<{ roomName?: string; username?: string }>({});
  const handleCreateRoom = () => {
    const trimmedName = roomName.trim();
    const trimmedUsername = username.trim();
    const newErrors: { roomName?: string; username?: string } = {};
    
    if (!trimmedName) {
      newErrors.roomName = "Por favor, ingresa un nombre para la sala";
    }
    
    if (!trimmedUsername) {
      newErrors.username = "Por favor, ingresa tu nombre de usuario";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onCreateRoom(trimmedName, maxUsers, trimmedUsername);
    resetForm();
  };

  const resetForm = () => {
    setRoomName("");
    setMaxUsers(10);
    setUsername("");
    setErrors({});
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
        label="Crear Sala"
        icon="pi pi-check"
        onClick={handleCreateRoom}
        autoFocus
      />
    </div>
  );

  return (
    <Dialog
      header="Crear Nueva Sala"
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
            className={errors.username ? "p-invalid" : ""}
            aria-describedby="username-error"
          />
          {errors.username && (
            <small id="username-error" className="p-error block mt-1">
              {errors.username}
            </small>
          )}
        </div>
        
        <div className="p-field mb-3">
          <label htmlFor="roomName" className="block mb-2">Nombre de la Sala</label>
          <InputText
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className={errors.roomName ? "p-invalid" : ""}
            aria-describedby="roomName-error"
          />
          {errors.roomName && (
            <small id="roomName-error" className="p-error block mt-1">
              {errors.roomName}
            </small>
          )}
        </div>

        <div className="p-field">
          <label htmlFor="maxUsers" className="block mb-2">Máximo de Usuarios</label>
          <InputNumber
            id="maxUsers"
            value={maxUsers}
            onValueChange={(e) => setMaxUsers(e.value || 10)}
            min={2}
            max={50}
          />
          <small className="text-muted block mt-1">
            Número máximo de usuarios que pueden unirse a la sala (2-50)
          </small>
        </div>
      </div>
    </Dialog>
  );
};
