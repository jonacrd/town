import { useState, useEffect } from 'react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

// Componente individual Toast
function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animación de entrada
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-cierre
    const duration = toast.duration || 5000;
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 200);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-accent',
          text: 'text-white',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'warning':
        return {
          bg: 'bg-warm',
          text: 'text-white',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'info':
      default:
        return {
          bg: 'bg-primary',
          text: 'text-primary-fg',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className={`transform transition-all duration-200 ease-in-out ${
      isVisible && !isLeaving 
        ? 'translate-y-0 opacity-100 scale-100' 
        : isLeaving 
          ? 'translate-y-2 opacity-0 scale-95'
          : '-translate-y-2 opacity-0 scale-95'
    }`}>
      <div className={`${styles.bg} ${styles.text} rounded-soft shadow-soft-lg p-4 max-w-sm w-full pointer-events-auto`}>
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className="flex-shrink-0">
            {styles.icon}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-relaxed">
              {toast.message}
            </p>
            
            {/* Botón de acción */}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-semibold underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-current rounded"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-20 rounded-soft transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-current"
            aria-label="Cerrar notificación"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Contenedor de Toasts
export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Hook para manejar toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (
    message: string,
    type: ToastData['type'] = 'info',
    options?: {
      duration?: number;
      action?: ToastData['action'];
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      message,
      type,
      duration: options?.duration,
      action: options?.action
    };

    setToasts(prev => [...prev, newToast]);
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const hideAllToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    showToast,
    hideToast,
    hideAllToasts
  };
}

export default Toast;
