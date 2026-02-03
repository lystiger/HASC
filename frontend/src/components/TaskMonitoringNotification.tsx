// frontend/src/components/TaskMonitoringNotification.tsx
import React, { useState, useEffect } from 'react';
import { useTaskMonitoring } from '../context/TaskMonitoringContext';
import { useProductPolling } from '../hooks/useProductPolling';
import type { MonitoringTask, TaskStatus } from '../types/task';
import type { Product } from '../types/product';
import { X, CheckCircle, AlertCircle, Loader, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

// Utility to get icon based on task status
const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'PENDING':
    case 'IN_PROGRESS':
      return <Loader className="animate-spin text-orange-safety" size={16} />;
    case 'COMPLETED':
      return <CheckCircle className="text-green-500" size={16} />;
    case 'FAILED':
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
  const shouldPoll = task.status === 'PENDING' || task.status === 'IN_PROGRESS';

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

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm mb-2">
      <div className="flex items-center space-x-2">
        {getStatusIcon(task.status)}
        <p className="text-sm text-gray-800">{task.message}</p>
      </div>
      {(task.status === 'COMPLETED' || task.status === 'FAILED') && (
        <button onClick={() => onDismiss(task.id)} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      )}
    </div>
  );
};


const TaskMonitoringNotification: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation
  const { tasks, updateTaskStatus } = useTaskMonitoring();
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
