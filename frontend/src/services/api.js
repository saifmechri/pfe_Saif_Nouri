import axios from "axios";

const resolvedApiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

const API = axios.create({
  baseURL: resolvedApiBaseUrl,
});

// Interceptor pour ajouter JWT automatiquement
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Si c'est FormData, ne pas définir Content-Type (laisser le navigateur le faire avec boundary)
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Interceptor pour gÃ©rer automatiquement les sessions expirÃ©es.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    const message = error?.response?.data?.message;

    const isAuthError =
      status === 401 &&
      (code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID" || message === "Token expirÃ©" || message === "Token invalide");

    if (isAuthError) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;

