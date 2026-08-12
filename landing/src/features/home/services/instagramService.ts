import { api } from '@/lib/api';
import { InstagramGallery } from '../types/instagramTypes';

export const instagramService = {
  getMedia: async (): Promise<InstagramGallery> => {
    const response = await api.get<InstagramGallery>('/instagram/media/public');
    return response.data;
  },
};