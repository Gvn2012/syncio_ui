export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isClosed: boolean;
  totalVotes: number;
  expiresAt?: string;
}

export interface GetPollsRequest {
  page?: number;
  limit?: number;
}

export interface GetPollsResponse {
  polls: Poll[];
  total: number;
}

export interface VoteRequest {
  pollId: string;
  optionId: string;
}

export interface VoteResponse {
  success: boolean;
  poll: Poll;
}
