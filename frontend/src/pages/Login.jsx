import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { initializeUserData } from "../utils/UserDataInit";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Clear ALL data on component mount
  useEffect(() => {
    sessionStorage.clear();
    localStorage.clear();
    console.log("Login page: All storage cleared");
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      // 1. CLEAR EVERYTHING FIRST
      sessionStorage.clear();
      localStorage.clear();
      console.log("Pre-login: All storage cleared");

      // 2. Login
      const response = await authAPI.login({
        email: username,
        password: password,
      });

      console.log("Login successful:", response.data);

      // 3. Store ONLY tokens initially
      if (response.data.access_token) {
        sessionStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("access_token", response.data.access_token);
      }
      if (response.data.refresh_token) {
        sessionStorage.setItem("refresh_token", response.data.refresh_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
      }

      // 4. Initialize user data from API
      await initializeUserData(authAPI);

      // 5. Navigate based on user type
      const userType = response.data.user_type;
      console.log("Navigating to dashboard for user type:", userType);

      if (userType === "business_admin") {
        navigate("/BusinessDash", { replace: true });
      } else if (userType === "business_subuser") {
        navigate("/SubUserDash", { replace: true });
      } else {
        navigate("/Dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Clear everything on error
      sessionStorage.clear();
      localStorage.clear();
      setError(
        error.response?.data?.detail || "Login failed. Please try again."
      );
    }
  };

  const handleSignUp = () => {
    navigate("/Question1");
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Left side - Contains the image */}
      <div className="w-1/2 hidden lg:block">
        <img
          src="/Background.png"
          alt="Login Background"
          className="object-cover w-full h-full"
        />
      </div>
      {/* Right side - Contains the login form + Logo */}
      <div className="lg:p-36 md:p-52 sm:p-20 p-8 w-full lg:w-1/2 flex flex-col justify-center">
        <div className="flex justify-center mb-6">
          <img
            src="/ClariFi-Logo.png"
            alt="Company Logo"
            className="h-auto w-auto max-w-xs"
          />
        </div>
        <div className="w-full max-w-md bg-[#7D5BA6] rounded-2xl p-8 border-8 border-[#89CE94] shadow-[0_13px_13px_#020000] mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Login
          </h1>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          
          {/* Login Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-white text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
                placeholder="Email Address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
              />
            </div>

            <div className="text-white text-sm">
              <a href="#" className="hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              onClick={handleSubmit}
              className="bg-[#89CE94] hover:bg-[#89A59C] text-white font-semibold rounded-md py-3 px-4 w-full mt-2"
            >
              Login
            </button>
          </div>
          
          <div className="mt-6 text-white text-center">
            <h3 className="text-sm">Don't have an account</h3>
            <a
              href="#"
              className="hover:underline hover:text-[#89CE94] text-sm mt-1 inline-block"
              onClick={handleSignUp}
            >
              Sign up Here
            </a>
          </div>
        </div>
        
        <div className="fixed bottom-4 right-4 text-xs text-gray-500">
          App is owned by Team Nova in partner with Commerce Bank
        </div>
      </div>
    </div>
  );
};

export default Login;