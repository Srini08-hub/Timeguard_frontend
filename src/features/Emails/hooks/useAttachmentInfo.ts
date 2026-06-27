import { useQuery } from '@tanstack/react-query';
import emailService from '../services/emailService';
import type { AttachmentInfo } from '../types/index';

export const useAttachmentInfo = (emailId: string | undefined) => {
  return useQuery<AttachmentInfo[], Error>({
    queryKey: ['attachmentInfo', emailId],
    queryFn: () => {
      if (!emailId) return [];
      return emailService.getAttachmentInfo(emailId);
    },
    enabled: !!emailId,
  });
};
