import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

// Add a request interceptor
API.interceptors.request.use((config) => {
  // FIRST try to get token from sessionStorage (most current)
  let token = sessionStorage.getItem("access_token");
  
  // If not in sessionStorage, check localStorage
  if (!token) {
    token = localStorage.getItem("access_token");
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Add a response interceptor to handle token expiration/errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear all auth data
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        sessionStorage.removeItem("refresh_token");
        
        // Redirect to login
        window.location.href = "/Login";
        
        return Promise.reject(error);
      } catch (refreshError) {
        // If refresh fails, clear everything and redirect to login
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/Login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Login - expects object with email and password
  login: (data) => {
    return API.post("/auth/login", data).then(response => {
      // Store token in BOTH sessionStorage (primary) and localStorage (backup)
      if (response.data.access_token) {
        sessionStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("access_token", response.data.access_token);
      }
      if (response.data.refresh_token) {
        sessionStorage.setItem("refresh_token", response.data.refresh_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
      }
      return response;
    });
  },

  // Logout - requires authentication
  logout: () => {
    return API.post("/auth/logout").then(response => {
      // Clear ALL auth data on logout
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("refresh_token");
      
      // Clear all user data
      const userKeys = ["user_name", "user_email", "business_name", "user_type", "first_name", "last_name", "email"];
      userKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      return response;
    }).catch(error => {
      // Even if API call fails, clear local data
      localStorage.clear();
      sessionStorage.clear();
      throw error;
    });
  },

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

// NEW: Chatbot API
export const chatbotAPI = {
  // Send a message to the chatbot
  sendMessage: (message, sessionId = null) => {
    return API.post("/chatbot/message", {
      message: message,
      session_id: sessionId
    });
  },

  // Get chat history
  getChatHistory: (limit = 50, sessionId = null) => {
    const params = { limit };
    if (sessionId) {
      params.session_id = sessionId;
    }
    return API.get("/chatbot/history", { params });
  },

  // Clear chat history
  clearChatHistory: (sessionId = null) => {
    const params = sessionId ? { session_id: sessionId } : {};
    return API.delete("/chatbot/history", { params });
  },

  // Get all sessions
  getSessions: () => {
    return API.get("/chatbot/sessions");
  },

  // Confirm delete operation
  confirmDelete: (confirmationId, confirm = true) => {
    return API.post("/chatbot/confirm-delete", {
      confirmation_id: confirmationId,
      confirm: confirm
    });
  },

  // Get pending deletes
  getPendingDeletes: () => {
    return API.get("/chatbot/pending-deletes");
  },

  // Health check
  healthCheck: () => {
    return API.get("/chatbot/health");
  }
};

export default {
  authAPI,
  chatbotAPI
};