import { api } from '@/lib/api';
import { SiteContentDTO } from '../types/siteContentTypes';

export const siteContentService = {
  getPublic: async (): Promise<SiteContentDTO> => {
    const response = await api.get<SiteContentDTO>('/site-content/public');
    return response.data;
  },
};