// frontend/src/components/TaskMonitoringNotification.tsx
import React, { useState, useEffect } from 'react';
import { useTaskMonitoring } from '../context/TaskMonitoringContext';
import { useProductPolling } from '../hooks/useProductPolling';
import { ACTIVE_TASK_STATUSES, TASK_STATUS } from '../types/task';
import type { MonitoringTask, TaskStatus } from '../types/task';
import type { Product } from '../types/product';
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

// Utility to get icon based on task status
const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case TASK_STATUS.PENDING:
    case TASK_STATUS.IN_PROGRESS:
      return <Loader className="animate-spin text-orange-safety" size={16} />;
    case TASK_STATUS.COMPLETED:
      return <CheckCircle className="text-green-500" size={16} />;
    case TASK_STATUS.FAILED:
      return <AlertCircle className="text-red-500" size={16} />;
    default:
      return null;
  }
};

interface TaskItemProps {
  task: MonitoringTask;
  onDismiss: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onDismiss }) => {
  const { t } = useTranslation(); // Initialize useTranslation
  // Use polling for products that are still pending or in progress
  const shouldPoll = ACTIVE_TASK_STATUSES.includes(task.status);
  const [dismissAt, setDismissAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const dismissAfterMs = 10000;

  useProductPolling({
    productId: task.productId,
    taskId: task.id,
    onSuccess: (product: Product) => {
      // Invalidate specific product query in public catalog
      // This is already done inside useProductPolling's useEffect,
      // but if we needed to trigger something else here, we could.
    },
    onError: (error: Error) => {
      console.error(t('common.polling_failed_for_product', { productId: task.productId }), error); // Translated
    },
  });

  useEffect(() => {
    if (task.status !== TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.FAILED) {
      setDismissAt(null);
      setRemainingMs(0);
      return;
    }
    const expiresAt = Date.now() + dismissAfterMs;
    setDismissAt(expiresAt);
    setRemainingMs(dismissAfterMs);
    const timeout = window.setTimeout(() => {
      onDismiss(task.id);
    }, dismissAfterMs);
    const interval = window.setInterval(() => {
      setRemainingMs(Math.max(0, expiresAt - Date.now()));
    }, 100);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [task.status, task.id, onDismiss]);

  const showCountdown = dismissAt !== null && remainingMs > 0;

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm mb-2">
      <div className="flex items-center space-x-2">
        {getStatusIcon(task.status)}
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{task.status}</p>
          <p className="text-sm text-gray-800">{task.message}</p>
        </div>
      </div>
      {(task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.FAILED) && (
        <div className="flex items-center gap-2">
          {showCountdown && (
            <span className="relative flex h-5 w-5 items-center justify-center text-[9px] font-semibold text-slate-600">
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#10b981 ${
                    Math.round((remainingMs / dismissAfterMs) * 360)
                  }deg, rgba(16, 185, 129, 0.2) ${
                    Math.round((remainingMs / dismissAfterMs) * 360)
                  }deg)`,
                }}
              />
              <span className="absolute inset-0 rounded-full border border-emerald-200" />
              <span className="relative z-10">
                {Math.max(0, Math.ceil(remainingMs / 1000))}
              </span>
            </span>
          )}
          <button onClick={() => onDismiss(task.id)} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};


const TaskMonitoringNotification: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation
  const { tasks } = useTaskMonitoring();
  const [visibleTasks, setVisibleTasks] = useState<MonitoringTask[]>([]);

  useEffect(() => {
    setVisibleTasks(tasks);
  }, [tasks]);

  const handleDismiss = (taskId: string) => {
    // A simple dismiss removes it from the visible list.
    // Optionally, could mark it as 'dismissed' in context state for persistence
    setVisibleTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // Only show the notification drawer if there are tasks to display
  if (visibleTasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <div className="bg-slate-industrial text-white p-3 rounded-t-lg shadow-lg flex justify-between items-center">
        <h3 className="font-semibold text-sm">{t('common.processing_tasks')}</h3>
        {/* Potentially add a "Clear All" button here */}
      </div>
      <div className="max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-b-lg shadow-lg">
        {visibleTasks.map((task) => (
          <TaskItem key={task.id} task={task} onDismiss={handleDismiss} />
        ))}
      </div>
    </div>
  );
};

export default TaskMonitoringNotification;
