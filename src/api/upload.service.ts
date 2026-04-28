import api from './api';
import type { GCSUploadResponse, GCSUploadData } from './types/gcs/types';

export interface UploadRequestPayload {
  fileName: string;
  fileContentType: string;
  size: number;
}

export interface MessageMediaUploadRequestPayload {
  fileName: string;
  fileContentType: string;
  size: number;
  conversationId: string;
  mediaType: 'IMAGE' | 'VIDEO';
  senderId: string;
}

export interface MessageMediaBatchUploadRequestPayload {
  requests: MessageMediaUploadRequestPayload[];
}

export const uploadService = {
 
  requestUploadUrl: async (payload: UploadRequestPayload): Promise<GCSUploadResponse> => {
    const response = await api.post<GCSUploadResponse>('upload', payload);
    return response.data;
  },

  requestMessageMediaUploadUrl: async (payload: MessageMediaUploadRequestPayload): Promise<GCSUploadResponse> => {
    const response = await api.post<GCSUploadResponse>('upload/messages', payload);
    return response.data;
  },

  requestMessageMediaBatchUploadUrl: async (payload: MessageMediaBatchUploadRequestPayload): Promise<{ data: { responses: GCSUploadData[] } }> => {
    const response = await api.post<{ data: { responses: GCSUploadData[] } }>('upload/messages/batch', payload);
    return response.data;
  },

  requestDownloadUrls: async (objectPaths: string[]): Promise<{ data: { downloadUrls: Record<string, string> } }> => {
    const response = await api.post<{ data: { downloadUrls: Record<string, string> } }>('upload/download-urls', { objectPaths });
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
  },

  uploadVideoToGcsChunked: async (
    uploadUrl: string, 
    file: File, 
    contentType: string, 
    headers: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    const initRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'x-goog-resumable': 'start',
        'Content-Type': contentType,
      }
    });

    if (!initRes.ok) {
      throw new Error('Failed to start resumable upload session');
    }

    const sessionUri = initRes.headers.get('Location');
    if (!sessionUri) {
      throw new Error('No Location header in resumable session response (check CORS Access-Control-Expose-Headers)');
    }

    const chunkSize = 1024 * 1024;
    const fileSize = file.size;
    let offset = 0;

    while (offset < fileSize) {
      const chunkEnd = Math.min(offset + chunkSize, fileSize);
      const chunk = file.slice(offset, chunkEnd);

      const chunkRes = await fetch(sessionUri, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${offset}-${chunkEnd - 1}/${fileSize}`
        },
        body: chunk
      });

      if (chunkRes.status === 308) {
        offset = chunkEnd;
        if (onProgress) onProgress(offset / fileSize);
      } else if (chunkRes.ok) {
        if (onProgress) onProgress(1);
        break;
      } else {
        throw new Error(`Failed to upload chunk: ${chunkRes.statusText}`);
      }
    }
  }
};
