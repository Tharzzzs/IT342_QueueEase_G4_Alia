import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onRemove, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const bgColor =
    toast.type === 'success' ? '#059669' :
    toast.type === 'error' ? '#dc2626' : '#2563eb';

  const icon =
    toast.type === 'success' ? '✓' :
    toast.type === 'error' ? '✕' : 'ℹ';

  return (
    <div
      className={`toast-item ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ '--toast-color': bgColor } as React.CSSProperties}
    >
      <span className="toast-icon" style={{ backgroundColor: bgColor }}>{icon}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => { setIsExiting(true); setTimeout(onRemove, 300); }}>×</button>
    </div>
  );
};

// Custom hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};

export default Toast;
