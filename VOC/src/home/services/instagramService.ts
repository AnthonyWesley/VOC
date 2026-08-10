import churchApi from "../../api/axios";
import { InstagramGallery } from "../types/instagramTypes";

export const instagramService = {
  getMedia: async (): Promise<InstagramGallery> => {
    const response = await churchApi.get("/instagram/media/public");
    return response.data;
  },
};