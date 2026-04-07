import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  GetSettingsRequest, 
  GetSettingsResponse, 
  UpdateSettingsRequest,
  UpdateSettingsResponse 
} from './types';

export const SettingsService = {
  /**
   * Fetch current user settings.
   * URI: GET http://syncio.site/api/v1/settings
   */
  getSettings: async (params: GetSettingsRequest): Promise<APIResource<GetSettingsResponse>> => {
    const response = await api.get<APIResource<GetSettingsResponse>>(`settings?userId=${params.userId}`);
    return response.data;
  },

  /**
   * Update user settings.
   * URI: PUT http://syncio.site/api/v1/settings
   */
  updateSettings: async (request: UpdateSettingsRequest): Promise<APIResource<UpdateSettingsResponse>> => {
    const response = await api.put<APIResource<UpdateSettingsResponse>>('settings', request);
    return response.data;
  }
};
