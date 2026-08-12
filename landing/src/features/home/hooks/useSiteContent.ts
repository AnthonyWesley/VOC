import { useQuery } from '@tanstack/react-query';
import { siteContentService } from '../services/siteContentService';

export function usePublicSiteContent() {
  return useQuery({
    queryKey: ['siteContentPublic'],
    queryFn: siteContentService.getPublic,
  });
}