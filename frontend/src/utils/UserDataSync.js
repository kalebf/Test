// utils/userDataSync.js

/**
 * Synchronizes user data between sessionStorage and localStorage
 * Ensures consistent data across all components
 */
export const syncUserData = () => {
  const userData = {
    name: sessionStorage.getItem("name") || sessionStorage.getItem("user_name"),
    email: sessionStorage.getItem("email"),
    user_type: sessionStorage.getItem("user_type"),
    business_name: sessionStorage.getItem("business_name"),
    first_name: sessionStorage.getItem("first_name"),
    last_name: sessionStorage.getItem("last_name")
  };
  
  // Clear localStorage of old user data
  const keysToRemove = ["name", "user_name", "email", "user_type", "business_name", "first_name", "last_name"];
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Set only current user data in localStorage
  Object.entries(userData).forEach(([key, value]) => {
    if (value) {
      localStorage.setItem(key, value);
    }
  });
  
  console.log("User data synchronized:", userData);
  return userData;
};

/**
 * Clears all user data except tokens
 */
export const clearUserData = () => {
  const accessToken = sessionStorage.getItem("access_token");
  const refreshToken = sessionStorage.getItem("refresh_token");
  
  // Clear all storage
  sessionStorage.clear();
  localStorage.clear();
  
  // Restore tokens if they exist
  if (accessToken) {
    sessionStorage.setItem("access_token", accessToken);
    localStorage.setItem("access_token", accessToken);
  }
  if (refreshToken) {
    sessionStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("refresh_token", refreshToken);
  }
  
  console.log("User data cleared, tokens preserved");
};