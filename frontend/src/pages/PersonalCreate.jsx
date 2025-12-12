import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const PersonalCreate = () => {
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setError("");

    // Validation
    if (!firstname || !lastname || !email || !password || !confirm) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      // FIXED: Pass data as an object
      const response = await authAPI.registerPersonal({
        firstname,
        lastname,
        email,
        password
      });

      console.log("Registration successful:", response);
      
      // Optional: auto-login after registration
      // const loginResponse = await authAPI.login({
      //   email,
      //   password
      // });
      // localStorage.setItem("access_token", loginResponse.data.access_token);
      
      navigate("/Login");
    } catch (error) {
      console.error("Registration failed:", error);
      setError(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="bg-gray-100 flex justify-center items-center h-screen overflow-hidden">
      <div className="w-1/2 h-screen hidden lg:block">
        <img
          src="/Background.png"
          alt="New User Background"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="lg:p-36 md:p-52 sm:p-20 p-8 w-full lg:w-1/2">
        <div className="flex justify-center mb-8">
          <img
            src="/ClariFi-Logo.png"
            alt="Company Logo"
            className="h-auto w-auto"
          />
        </div>
        <div className="w-full max-w-md bg-[#7D5BA6] rounded-2xl p-8 mx-4 border-9 border-[#89CE94] shadow-[0_13px_13px_#020000]">
          <h1 className="text-2xl font-semibold mb-4 text-center">Sign Up </h1>
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <div>
            <div className="mb-4">
              <label htmlFor="firstname" className="block text-white">
                First Name
              </label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                value={firstname}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="lastname" className="block text-white">
                Last Name
              </label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                value={lastname}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-white">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-white">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirm" className="block text-white">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm"
                name="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
              />
            </div>
            
            <button
              onClick={handleCreate}
              className="bg-[#89CE94] hover:bg-[#89A59C] text-white font-semibold rounded-md py-2 px-4 w-full"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalCreate;