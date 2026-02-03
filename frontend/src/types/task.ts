export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface MonitoringTask {
  id: string;
  productId: string;
  status: TaskStatus;
  message: string;
}
