import churchApi from "../../api/axios";

export interface LoginPayload {
  email: string;
  password: string;
}
export interface ValidateCodePayload {
  code: string;
  type: AuthTokenType;
  context: string;
}

interface StartUserRegistrationPayload {
  email: string;
  phone: string;
}

interface CompleteUserRegistrationPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  code: string;
}

export type AuthTokenType =
  | "GUEST_ACCESS"
  | "PHONE_VERIFICATION"
  | "EMAIL_VERIFICATION"
  | "PASSWORD_RESET";

export const authService = {
  login: async (data: LoginPayload) => {
    const response = await churchApi.post("/users/login", data);
    return response.data;
  },

  update: async (userId: string, data: any) => {
    const response = await churchApi.patch(`/users/${userId}`, data);
    return response.data;
  },

  findOne: async () => {
    const response = await churchApi.get("/users/me");
    return response.data;
  },

  validateCode: async (data: ValidateCodePayload) => {
    const response = await churchApi.post("/auth/validate-code", data);
    return response.data;
  },

  resetPassword: async (data: any) => {
    const response = await churchApi.post("/auth/reset-password", data);
    return response.data;
  },

  requestPassword: async (data: any) => {
    const response = await churchApi.post("/auth/reset-password", data);
    return response.data;
  },

  updateTemporaryPassword: async (data: any) => {
    const response = await churchApi.post(
      "/users/auth/update-temporary-password",
      data,
    );
    return response.data;
  },

  requestPhoneCode: async (data: { phone: string; resend?: boolean }) => {
    const response = await churchApi.post("/auth/request-phone-code", data);
    return response.data;
  },

  confirm: async (userId: string, code: string) => {
    console.log(userId);

    const response = await churchApi.patch(`/users/${userId}/confirm`, {
      code,
    });
    return response.data;
  },

  startUserRegistration: async (data: StartUserRegistrationPayload) => {
    try {
      const response = await churchApi.post("/auth/registration/start", {
        email: data.email,
        phone: data.phone,
      });

      return response.data;
    } catch (error) {
      console.error("Erro no startUserRegistration:", error);
      throw error;
    }
  },

  completeUserRegistration: async (data: CompleteUserRegistrationPayload) => {
    try {
      const response = await churchApi.post("/auth/registration/complete", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        code: data.code,
      });

      return response.data;
    } catch (error) {
      console.error("Erro no completeUserRegistration:", error);
      throw error;
    }
  },

  logout: async () => {
    const response = await churchApi.post("/users/logout");
    return response.data;
  },
};
