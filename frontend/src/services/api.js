import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

// Add token to requests if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  // Login - expects object with email and password
  login: (data) => API.post("/auth/login", data),

  // Register Personal - expects object with firstname, lastname, email, password
  registerPersonal: (data) => API.post("/auth/register/personal", data),

  // Register Business Admin - expects object with fullname, businessname, email, password
  registerBusinessAdmin: (data) => API.post("/auth/register/business_admin", data),

  // Register Business Subuser - expects object with fullname, businessemail, email, password
  registerBusinessSub: (data) => API.post("/auth/register/business_subuser", data),
  
  getProfile: () => API.get("/auth/profile"),
  
  updatePersonalProfile: (data) => API.put("/auth/profile/personal", data),
  
  updateBusinessProfile: (data) => API.put("/auth/profile/business", data),
  
  updateSubUserProfile: (data) => API.put("/auth/profile/subuser", data),
  
  changePassword: (data) => API.put("/auth/change-password", data),
  
  debugHeaders: () => API.get("/auth/debug-headers"),
};

export default {
  authAPI
};