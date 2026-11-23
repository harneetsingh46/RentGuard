
import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 403) {
      const verificationStatus = error.response?.data?.verificationStatus;
      if (
        verificationStatus === "pending" ||
        verificationStatus === "rejected"
      ) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/owner/verification"
        ) {
          window.location.assign("/owner/verification");
        }
        return Promise.reject(error);
      }
    }

    if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      console.log("Unauthorized or forbidden");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
