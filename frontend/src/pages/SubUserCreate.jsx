import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const SubUserCreate = () => {
  const [fullname, setFullName] = useState("");
  const [businessemail, setBusinessEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setError("");

    // Validation
    if (!fullname || !businessemail || !email || !password || !confirm) {
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

    try {
      // FIXED: Pass data as an object
      const response = await authAPI.registerBusinessSub({
        fullname,
        businessemail,
        email,
        password
      });

      console.log("Sub-user registration successful:", response.data);
      navigate("/Login");
    } catch (error) {
      console.error("Registration failed:", error);
      setError(
        error.response?.data?.detail ||
          "Registration failed. Please check the business email and try again."
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
              <label htmlFor="fullname" className="block text-white">
                Full Name
              </label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                value={fullname}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="businessemail" className="block text-white">
                Business Email
              </label>
              <input
                type="text"
                id="businessemail"
                name="businessemail"
                value={businessemail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-white">
                Email
              </label>
              <input
                type="text"
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
                Confrim Password
              </label>
              <input
                type="password"
                id="confrim"
                name="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                autoComplete="off"
              />
            </div>
            {/*replace this with another password box, but it will be for confirming password. what other fields will we require*/}
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

export default SubUserCreate;
