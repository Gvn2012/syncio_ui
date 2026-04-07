export interface APIResource<T> {
  success: boolean;
  message: string;
  data: T;
  status: string;
  timestamp: string;
  error?: ErrorResource;
}

export interface ErrorResource {
  code?: string;
  message: string;
  detail?: string;
}
