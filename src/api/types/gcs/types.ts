import type { APIResource } from '../api-resource';

export interface GCSUploadData {
  imageId: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresIn: number;
}

export type GCSUploadResponse = APIResource<GCSUploadData>;
