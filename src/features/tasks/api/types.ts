export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueAt?: string;
  assigneeId?: string;
  creatorId: string;
}

export interface GetTasksRequest {
  status?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
}

export interface GetTasksResponse {
  tasks: Task[];
  total: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueAt?: string;
  assigneeId?: string;
}

export interface CreateTaskResponse {
  task: Task;
}
