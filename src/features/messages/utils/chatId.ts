export const generateDirectChatId = (userId1: string, userId2: string): string => {
  const ids = [userId1, userId2].sort();
  return `direct_${ids[0]}_${ids[1]}`;
};

export const isDirectChatId = (id: string): boolean => {
  return id.startsWith('direct_');
};

export const getParticipantsFromDirectChatId = (id: string): string[] => {
  if (!isDirectChatId(id)) return [];
  return id.replace('direct_', '').split('_');
};
