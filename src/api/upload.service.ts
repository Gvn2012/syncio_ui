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

export const isUrlExpired = (url: string | null | undefined): boolean => {
  if (!url || !url.startsWith('http')) return false;
  
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    const googDate = params.get('X-Goog-Date') || params.get('x-goog-date');
    const googExpires = params.get('X-Goog-Expires') || params.get('x-goog-expires');
    
    if (googDate && googExpires) {
      const match = googDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
      if (match) {
        const [_, year, month, day, hour, minute, second] = match;
        const createdDate = new Date(Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        ));
        
        const expiryTime = createdDate.getTime() + (parseInt(googExpires) * 1000);
        return Date.now() > (expiryTime - 300000);
      }
    }
    
    const expires = params.get('Expires') || params.get('expires');
    if (expires) {
      const expiryTime = parseInt(expires) * 1000;
      return Date.now() > (expiryTime - 300000);
    }
  } catch (e) {
    console.error('Error checking URL expiration:', e);
    return false;
  }
  
  return false;
};

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
    const response = await api.post<{ data: { downloadUrls: Record<string, string> } }>('upload/internal/download-urls', { objectPaths });
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
