import api from './api';
import type { GCSUploadResponse } from './types/gcs/types';

export interface UploadRequestPayload {
  fileName: string;
  fileContentType: string;
  size: number;
}

export const uploadService = {
 
  requestUploadUrl: async (payload: UploadRequestPayload): Promise<GCSUploadResponse> => {
    const response = await api.post<GCSUploadResponse>('upload', payload);
    return response.data;
  },
  uploadToGcs: async (uploadUrl: string, file: File, contentType: string, headers: Record<string, string>): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        ...headers,
        'Content-Type': contentType,
      }
    });

    if (!response.ok) {
      throw new Error(`GCS upload failed: ${response.statusText}`);
    }
  }
};
