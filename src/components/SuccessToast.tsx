import React from 'react';
import { Toast } from 'primereact/toast';

interface SuccessToastProps {
  toastRef: React.RefObject<Toast | null>;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ toastRef }) => {
  return (
    <Toast ref={toastRef} position="top-right" />
  );
};

export const showSuccessMessage = (toastRef: React.RefObject<Toast | null>, summary: string, detail: string) => {
  toastRef.current?.show({
    severity: 'success',
    summary: summary,
    detail: detail,
    life: 3000
  });
};

export const showErrorMessage = (toastRef: React.RefObject<Toast | null>, summary: string, detail: string) => {
  toastRef.current?.show({
    severity: 'error',
    summary: summary,
    detail: detail,
    life: 3000
  });
};
