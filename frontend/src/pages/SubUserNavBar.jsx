import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../utils/logout";

export default function SubUserNavBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [userName, setUserName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      // Get data from sessionStorage ONLY (single source of truth)
      const name = sessionStorage.getItem("name") || "";
      const business = sessionStorage.getItem("business_name") || "";
      const type = sessionStorage.getItem("user_type") || "";

      console.log("SubUserNavBar - Loading:", { name, business, type });

      if (name) {
        setUserName(name);
        const initials = name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase();
        setUserInitials(initials);
      } else {
        setUserName("");
        setUserInitials("U");
      }

      setBusinessName(business);

      // Verify this is a sub user
      if (type && type !== "business_subuser") {
        console.warn("SubUserNavBar being used by non-sub-user. Redirecting.");
        navigate("/Login");
        return;
      }
    };

    // Load immediately
    loadUserData();
    
    // Listen for updates
    const handleStorageChange = () => {
      console.log("SubUserNavBar - Storage change detected");
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);
    window.addEventListener('userDataInitialized', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
      window.removeEventListener('userDataInitialized', handleStorageChange);
    };
  }, [navigate, location.pathname]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const navItems = [
    {
      path: "/SubUserDash",
      name: "Dashboard",
      icon: (
        <svg
          className="h-6 w-6 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>
      ),
    },
  ];

  const handleSettingsClick = () => {
    navigate("/SubUserSettings");
  };

  return (
    <aside
      className={`flex flex-col items-center text-white h-screen transition-all duration-300 ${
        isExpanded ? "w-64" : "w-20"
      }`}
      style={{
        backgroundColor: "#174D1F",
        boxShadow: "4px 0 12px rgba(0, 0, 0, 0.15)",
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Profile Circle with Name */}
      <div className="h-24 flex flex-col items-center w-full justify-center px-4 mb-2">
        <div
          className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-700 font-bold flex-shrink-0 text-lg mb-2"
          style={{
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            border: "3px solid #6BB577",
          }}
        >
          {userInitials}
        </div>
        {isExpanded && userName && (
          <div className="text-center">
            <p className="text-sm font-medium text-white truncate max-w-full">
              {userName}
            </p>
            {businessName && (
              <p className="text-xs text-gray-300 truncate max-w-full">
                {businessName}
              </p>
            )}
            <p className="text-xs text-gray-300">Sub-user</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full px-2">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-green-600 bg-opacity-30 shadow-lg"
                    : "hover:bg-green-600 hover:bg-opacity-20"
                }`}
                style={{
                  ...(isActive(item.path) && {
                    borderLeft: "4px solid #6BB577",
                  }),
                }}
              >
                <div
                  className={`transition-transform duration-200 ${
                    isActive(item.path) ? "scale-110" : ""
                  }`}
                >
                  {item.icon}
                </div>
                {isExpanded && (
                  <span
                    className={`ml-4 text-sm font-medium whitespace-nowrap transition-all ${
                      isActive(item.path) ? "font-semibold" : ""
                    }`}
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings and Logout */}
      <div className="w-full px-2 pb-4 border-t border-white border-opacity-20 pt-2 space-y-2">
        {/* Settings Button */}
        <button
          onClick={handleSettingsClick}
          className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-left ${
            isActive("/SubUserSettings")
              ? "bg-green-600 bg-opacity-30 shadow-lg"
              : "hover:bg-green-600 hover:bg-opacity-20"
          }`}
          style={{
            ...(isActive("/SubUserSettings") && {
              borderLeft: "4px solid #6BB577",
            }),
          }}
        >
          <div
            className={`transition-transform duration-200 ${
              isActive("/SubUserSettings") ? "scale-110" : ""
            }`}
          >
            <svg
              className="h-6 w-6 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
          {isExpanded && (
            <span
              className={`ml-4 text-sm font-medium whitespace-nowrap ${
                isActive("/SubUserSettings") ? "font-semibold" : ""
              }`}
            >
              Settings
            </span>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-left hover:bg-red-600 hover:bg-opacity-30"
        >
          <div className="transition-transform duration-200">
            <svg
              className="h-6 w-6 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>
          {isExpanded && (
            <span className="ml-4 text-sm font-medium whitespace-nowrap">
              Logout
            </span>
          )}
        </button>
      </div>

      {/* Logo Section */}
      <div className="h-24 flex items-center justify-center w-full px-4">
        <img
          src={isExpanded ? "/ClariFi-Logo.png" : "/ClariFi-Logo-Small.png"}
          alt="Logo"
          className={`object-contain transition-all duration-300 ${
            isExpanded ? "h-12 w-auto" : "h-14 w-14"
          }`}
          style={{
            filter: "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.25))",
          }}
        />
      </div>
    </aside>
  );
}