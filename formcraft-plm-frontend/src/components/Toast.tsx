import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastCount = 0;
const toastListeners: Array<(t: ToastMessage) => void> = [];

export function toast(message: string, type: ToastType = 'info') {
  const id = ++toastCount;
  toastListeners.forEach((l) => l({ id, message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (t: ToastMessage) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500);
    };
    toastListeners.push(listener);
    return () => {
      const idx = toastListeners.indexOf(listener);
      if (idx >= 0) toastListeners.splice(idx, 1);
    };
  }, []);

  const iconFor = (type: ToastType) => {
    if (type === 'error') return <AlertCircle size={20} />;
    if (type === 'success') return <CheckCircle size={20} />;
    return <Info size={20} />;
  };

  const colorFor = (type: ToastType) => {
    if (type === 'error') return 'var(--danger)';
    if (type === 'success') return 'var(--success)';
    return 'var(--accent-primary)';
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast" style={{ borderLeftColor: colorFor(t.type) }}>
          {iconFor(t.type)}
          {t.message}
        </div>
      ))}
    </div>
  );
}
