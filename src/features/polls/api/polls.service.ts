import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  GetPollsRequest, 
  GetPollsResponse, 
  VoteRequest,
  VoteResponse 
} from './types';

export const PollsService = {
  /**
   * Fetch polls.
   * URI: GET http://syncio.site/api/v1/polls
   */
  getPolls: async (params: GetPollsRequest): Promise<APIResource<GetPollsResponse>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const response = await api.get<APIResource<GetPollsResponse>>(`polls?${query.toString()}`);
    return response.data;
  },

  /**
   * Cast a vote on a poll.
   * URI: POST http://syncio.site/api/v1/polls/vote
   */
  castVote: async (request: VoteRequest): Promise<APIResource<VoteResponse>> => {
    const response = await api.post<APIResource<VoteResponse>>('polls/vote', request);
    return response.data;
  }
};
