import churchApi from "../../api/axios";

export const dashboardService = {
  get: async () => {
    const response = await churchApi.get(`/dashboard`);
    console.log(response.data);

    return response.data;
  },
};
