import { useState, useEffect } from 'react';
import { UserService } from '../../user/api/user.service';

const participantCache: Record<string, { name: string; avatar?: string }> = {};
const inflightRequests: { [key: string]: Promise<void> | undefined } = {};

export const useParticipant = (participantId: string | null | undefined) => {
  const [participant, setParticipant] = useState<{ name: string; avatar?: string } | null>(
    participantId ? participantCache[participantId] : null
  );
  const [loading, setLoading] = useState<boolean>(!!participantId && !participantCache[participantId]);

  useEffect(() => {
    if (!participantId || participantCache[participantId]) {
      if (participantId && participantCache[participantId]) {
        setParticipant(participantCache[participantId]);
      }
      setLoading(false);
      return;
    }

    if (inflightRequests[participantId]) {
      inflightRequests[participantId].then(() => {
        if (participantCache[participantId]) {
          setParticipant(participantCache[participantId]);
        }
        setLoading(false);
      });
      return;
    }

    const fetchParticipant = async () => {
      try {
        setLoading(true);
        const request = UserService.getUserDetail(participantId);
        inflightRequests[participantId] = request.then(() => {});
        
        const res = await request;
        if (res.success) {
          const user = res.data.userResponse;
          const profile = res.data.userProfileResponse;
          const primaryPicture = profile?.userProfilePictureResponseList?.find(p => p.primary);
          
          const data = {
            name: `${user.firstName} ${user.lastName}`,
            avatar: primaryPicture?.url
          };
          
          participantCache[participantId] = data;
          setParticipant(data);
        }
      } catch (err) {
        console.error('Failed to fetch participant info', err);
      } finally {
        delete inflightRequests[participantId];
        setLoading(false);
      }
    };

    fetchParticipant();
  }, [participantId]);

  return { participant, loading };
};
