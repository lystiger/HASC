export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export const ACTIVE_TASK_STATUSES: TaskStatus[] = [
  TASK_STATUS.PENDING,
  TASK_STATUS.IN_PROGRESS,
];

export interface MonitoringTask {
  id: string;
  productId: string;
  status: TaskStatus;
  message: string;
}
