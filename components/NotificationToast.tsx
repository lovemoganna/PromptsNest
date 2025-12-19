import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationToastProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 4000); // Auto dismiss after 4s
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const getStyles = () => {
    switch (notification.type) {
      case 'success': return 'bg-white dark:bg-slate-800 border-l-4 border-green-500 text-slate-800 dark:text-slate-100 shadow-lg shadow-green-900/5 dark:shadow-none';
      case 'error': return 'bg-white dark:bg-slate-800 border-l-4 border-red-500 text-slate-800 dark:text-slate-100 shadow-lg shadow-red-900/5 dark:shadow-none';
      case 'info': return 'bg-slate-800 dark:bg-slate-700 border-l-4 border-blue-500 text-white shadow-lg shadow-slate-900/10 dark:shadow-none';
      default: return 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'error': return <AlertCircle size={18} className="text-red-500" />;
      case 'info': return <Info size={18} className="text-blue-400" />;
    }
  };

  return (
    <div className={`pointer-events-auto min-w-[300px] max-w-sm rounded-lg p-4 flex items-start gap-3 shadow-xl transform transition-all animate-in slide-in-from-right-10 fade-in duration-300 border border-slate-100 dark:border-slate-700 ${getStyles()}`}>
      <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium leading-snug">{notification.message}</p>
        {notification.action && (
          <button
            onClick={() => {
              notification.action?.onClick();
              onDismiss(notification.id);
            }}
            className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors border border-white/20`}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="text-current opacity-50 hover:opacity-100 transition-opacity p-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default NotificationToast;