/**
 * Initializes user data after login
 */
export const initializeUserData = async (authAPI) => {
  try {
    console.log("Initializing user data...");
    
    // Clear ALL old data first (except tokens)
    const accessToken = sessionStorage.getItem("access_token");
    const refreshToken = sessionStorage.getItem("refresh_token");
    
    sessionStorage.clear();
    localStorage.clear();
    
    // Restore tokens
    if (accessToken) {
      sessionStorage.setItem("access_token", accessToken);
      localStorage.setItem("access_token", accessToken);
    }
    if (refreshToken) {
      sessionStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("refresh_token", refreshToken);
    }
    
    // Get fresh user profile from API
    const response = await authAPI.getProfile();
    const userData = response.data;
    
    console.log("Received user data from API:", userData);
    
    // Process name
    const displayName = userData.display_name || "";
    const nameParts = displayName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    
    // Prepare data with consistent keys
    const processedData = {
      name: userData.display_name,
      email: userData.email,
      user_type: userData.user_type,
      business_name: userData.business_name || "",
      first_name: userData.first_name || firstName,
      last_name: userData.last_name || lastName
    };
    
    // Store in sessionStorage ONLY (single source of truth)
    Object.entries(processedData).forEach(([key, value]) => {
      if (value) {
        sessionStorage.setItem(key, value);
      }
    });
    
    console.log("User data initialized and stored:", processedData);
    
    // Dispatch events to notify all components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('profileUpdated'));
    window.dispatchEvent(new CustomEvent('userDataInitialized'));
    
    return processedData;
  } catch (error) {
    console.error("Error initializing user data:", error);
    throw error;
  }
};

/**
 * Clears all user data on logout
 */
export const clearUserData = () => {
  console.log("Clearing all user data...");
  sessionStorage.clear();
  localStorage.clear();
  console.log("All user data cleared");
};