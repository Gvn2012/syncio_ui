import api from '../../../api/api';

export interface CallSession {
  callId: string;
  conversationId: string;
  initiatorId: string;
  callMode: string;
  startedAt: number;
  status: string;
  activeParticipantIds: string[];
  participantEvents: any[];
}

export const callApi = {
  getCallSession: async (callId: string): Promise<CallSession> => {
    const response = await api.get(`/messaging/api/call/session/${callId}`);
    return response.data.data;
  },
  
  getActiveCall: async (conversationId: string): Promise<CallSession> => {
    const response = await api.get(`/messaging/api/call/active/${conversationId}`);
    return response.data.data;
  }
};
