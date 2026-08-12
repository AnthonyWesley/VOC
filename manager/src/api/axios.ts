import axios from "axios";

const churchApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",
  withCredentials: true, // ESSENCIAL: Envia os cookies httpOnly em todas as chamadas
});

// ====== Controle de Fila para Refresh ======
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

// ====== Interceptor de RESPOSTA (Onde o Refresh acontece) ======
churchApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Adicione isso logo acima do check do 401 no interceptor de resposta:
    if (error.response?.status === 403) {
      return Promise.reject(error);
    }

    // Se não for erro 401 ou se a requisição já foi tentada, encerra
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Se for uma rota que não deve tentar refresh (ex: o próprio login ou refresh)
    const bypassRefresh = ["/users/login", "/users/refresh"].some((url) =>
      originalRequest.url?.includes(url),
    );

    if (bypassRefresh) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => churchApi(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      console.warn("[AUTH] Access token expired. Attempting silent refresh...");

      // Chamada para o SEU backend para renovar o cookie
      // O backend vai ler o refreshToken do cookie e setar um novo accessToken
      await churchApi.post("/users/refresh");

      processQueue(null);
      return churchApi(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      console.error("🔐 Sessão expirada completamente. Redirecionando...");

      const isPublicPage =
        window.location.pathname.startsWith("/auth/");

      if (!isPublicPage && !sessionStorage.getItem("redirected")) {
        sessionStorage.setItem("redirected", "true");
        window.location.replace("/auth/login");
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default churchApi;
