import { authAPI } from "../services/api";

/**
 * Clears all user session data
 */
export const clearSessionData = () => {
  console.log("Clearing all session data...");
  
  // Clear ALL sessionStorage
  sessionStorage.clear();
  
  // Clear ALL localStorage
  localStorage.clear();
  
  // Clear any cookies
  document.cookie.split(";").forEach(cookie => {
    document.cookie = cookie
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  console.log("All session data cleared");
};

/**
 * Logout function that calls API and clears local data
 */
export const logoutUser = async () => {
  try {
    console.log("Logging out user...");
    
    // Try to call logout API
    try {
      await authAPI.logout();
    } catch (apiError) {
      console.error("Logout API call failed (continuing anyway):", apiError);
    }
    
    // Clear ALL storage regardless of API result
    clearSessionData();
    
    // Redirect to login
    console.log("Redirecting to login...");
    window.location.href = '/Login';
  } catch (error) {
    console.error("Error during logout:", error);
    // Still redirect even if everything fails
    clearSessionData();
    window.location.href = '/Login';
  }
};