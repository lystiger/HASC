// frontend/src/context/TaskMonitoringContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { TASK_STATUS } from '../types/task';
import type { MonitoringTask, TaskStatus } from '../types/task';

interface TaskMonitoringContextType {
  tasks: MonitoringTask[];
  addTask: (productId: string, initialMessage: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, message?: string) => void;
}

const TaskMonitoringContext = createContext<TaskMonitoringContextType | undefined>(undefined);

export const useTaskMonitoring = () => {
  const context = useContext(TaskMonitoringContext);
  if (!context) {
    throw new Error('useTaskMonitoring must be used within a TaskMonitoringProvider');
  }
  return context;
};

interface TaskMonitoringProviderProps {
  children: ReactNode;
}

export const TaskMonitoringProvider: React.FC<TaskMonitoringProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<MonitoringTask[]>([]);

  const addTask = useCallback((productId: string, initialMessage: string) => {
    // Generate a unique ID for the task, could be based on productId or a UUID
    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTask: MonitoringTask = {
      id: newTaskId,
      productId,
      status: TASK_STATUS.PENDING,
      message: initialMessage,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    return newTaskId; // Return the new task ID for external reference
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus, message?: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status, message: message || task.message } : task
      )
    );
  }, []);

  return (
    <TaskMonitoringContext.Provider value={{ tasks, addTask, updateTaskStatus }}>
      {children}
    </TaskMonitoringContext.Provider>
  );
};
