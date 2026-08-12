import churchApi from "../../api/axios";
import {
  SiteContentDTO,
  SiteContentUpdateInput,
} from "../types/siteContentTypes";

export const siteContentService = {
  getPublic: async (): Promise<SiteContentDTO> => {
    const response = await churchApi.get("/site-content/public");
    return response.data;
  },

  getAdmin: async (): Promise<SiteContentDTO> => {
    const response = await churchApi.get("/site-content");
    return response.data;
  },

  update: async (
    data: SiteContentUpdateInput,
  ): Promise<SiteContentDTO> => {
    const response = await churchApi.patch("/site-content", data);
    return response.data;
  },
};
