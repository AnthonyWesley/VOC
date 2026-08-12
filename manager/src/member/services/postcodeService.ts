import churchApi from "../../api/axios";

export type PostcodeLookupResult = {
  address: string;
  postcode: string;
  country: string | null;
  region: string | null;
  adminDistrict: string | null;
};

export const postcodeService = {
  lookup: async (postcode: string): Promise<PostcodeLookupResult | null> => {
    const response = await churchApi.get(`/postcode/${postcode}`);
    return response.data;
  },
};
