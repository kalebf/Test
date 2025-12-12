import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Question2 = () => {
  const [objective, setObjective] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!objective) {
      alert("Please select an option");
      return;
    }

    if (objective === "create") {
      navigate("/AdminCreate");
    } else if (objective === "join") {
      navigate("/SubUserCreate");
    }
    console.log("Selected objective: ", objective);
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden ">
      {/*Left side - Contains the image  */}
      <div className="w-1/2 hidden lg:block">
        <img
          src="/Background.png"
          alt="Login Background"
          className="object-cover w-full h-full "
        />
      </div>
      {/*Right side - Contains the login form  + Logo */}
      <div className="lg:p-36 md:p-52 sm:p-20 p-8 w-full lg:w-1/2">
        <div className="flex justify-center mb-4 relative left-[-24px]">
          <img
            src="/ClariFi-Logo.png"
            alt="Company Logo"
            className="h-auto w-auto"
          />
        </div>
        <div className="w-full max-w-md bg-[#7D5BA6] rounded-2xl p-8 border-7 border-[#89CE94] shadow-[0_13px_13px_#020000]">
          <h1 className="text-2xl font-semibold text-white mb-6 text-center leading-tight">
            Are you creating an account for <br />
            a business or joining and existing <br />
            business account?
          </h1>
          {/*Answer to the Question*/}
          <div className="space-y-6 mb-8 flex flex-col items-center">
            <div className="flex items-center justify-center w-full">
              <input
                type="radio"
                id="create"
                name="objective"
                value="create"
                checked={objective === "create"}
                onChange={(e) => setObjective(e.target.value)}
                className="w-6 h-6 text-[#89cE94] border-2 border-gray-300 focus:ring-[89CE94] focus:ring-2"
              />
              <label
                htmlFor="create"
                className="ml-3 text-white text-xl font-medium"
              >
                Create Business Account
              </label>
            </div>

            <div className="flex items-center justify-center w-full">
              <input
                type="radio"
                id="join"
                name="objective"
                value="join"
                checked={objective === "join"}
                onChange={(e) => setObjective(e.target.value)}
                className="w-6 h-6 text-[#89cE94] border-2 border-gray-300 focus:ring-[#89CE94] focus:ring-2"
              />
              <label
                htmlFor="join"
                className="ml-3 text-white text-xl font-medium "
              >
                Join Business Account
              </label>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="bg-[#89CE94] hover:bg-[#89A59C] text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            Continue
            <span className="ml-2">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Question2;
