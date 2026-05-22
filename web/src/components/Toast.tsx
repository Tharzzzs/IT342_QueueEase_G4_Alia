import React, { useEffect, useState } from 'react';
import { Check, Info, X } from 'lucide-react';

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
    toast.type === 'success' ? '#047857' :
    toast.type === 'error' ? '#b91c1c' : '#1d4ed8';

  const icon =
    toast.type === 'success' ? <Check size={15} /> :
    toast.type === 'error' ? <X size={15} /> : <Info size={15} />;

  return (
    <div
      className={`toast-item ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ '--toast-color': bgColor } as React.CSSProperties}
    >
      <span className="toast-icon" style={{ backgroundColor: bgColor }}>{icon}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => { setIsExiting(true); setTimeout(onRemove, 300); }}>
        <X size={16} />
      </button>
    </div>
  );
};

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
