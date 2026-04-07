export interface UserPreferences {
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  notificationsEnabled: boolean;
  language: string;
  timezone: string;
}

export interface GetSettingsRequest {
  userId: string;
}

export interface GetSettingsResponse {
  preferences: UserPreferences;
}

export interface UpdateSettingsRequest {
  preferences: Partial<UserPreferences>;
}

export interface UpdateSettingsResponse {
  preferences: UserPreferences;
}
