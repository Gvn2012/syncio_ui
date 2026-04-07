import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  GetTasksRequest, 
  GetTasksResponse, 
  CreateTaskRequest,
  CreateTaskResponse 
} from './types';

export const TasksService = {
  /**
   * Fetch tasks for a user or organization.
   * URI: GET http://syncio.site/api/v1/tasks
   */
  getTasks: async (params: GetTasksRequest): Promise<APIResource<GetTasksResponse>> => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.assigneeId) query.append('assigneeId', params.assigneeId);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const response = await api.get<APIResource<GetTasksResponse>>(`tasks?${query.toString()}`);
    return response.data;
  },

  /**
   * Create a new task.
   * URI: POST http://syncio.site/api/v1/tasks
   */
  createTask: async (data: CreateTaskRequest): Promise<APIResource<CreateTaskResponse>> => {
    const response = await api.post<APIResource<CreateTaskResponse>>('tasks', data);
    return response.data;
  }
};
