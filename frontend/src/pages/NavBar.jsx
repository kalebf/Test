import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../utils/logout";

export default function NavBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [userType, setUserType] = useState("");
  const [userName, setUserName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      // Get data from sessionStorage ONLY (single source of truth)
      const name = sessionStorage.getItem("name") || "";
      const type = sessionStorage.getItem("user_type") || "";
      const business = sessionStorage.getItem("business_name") || "";
      
      console.log("NavBar - Loading:", { name, type, business });

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

      setUserType(type);
      setBusinessName(business);
    };

    // Load immediately
    loadUserData();
    
    // Listen for updates
    const handleStorageChange = () => {
      console.log("NavBar - Storage change detected");
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
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  // Define navigation items based on user type
  const getNavItems = () => {
    if (userType === "business_admin") {
      return [
        {
          path: "/BusinessDash",
          name: "Dashboard",
          icon: (
            <svg className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          ),
        },
        {
          path: "/Chatbot",
          name: "Chat Assistant",
          icon: (
            <svg className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          ),
        },
        {
          path: "/BusinessGoals",
          name: "Business Goals",
          icon: (
            <svg className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ),
        },
      ];
    } else if (userType === "business_subuser") {
      // Sub-user should use SubUserNavBar, not this one
      navigate("/SubUserDash");
      return [];
    } else {
      // Personal user
      return [
        {
          path: "/Dashboard",
          name: "Dashboard",
          icon: (
            <svg className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          ),
        },
        {
          path: "/Chatbot",
          name: "Chat Assistant",
          icon: (
            <svg className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          ),
        },
        {
          path: "/Goals",
          name: "Goals",
          icon: (
            <svg className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ),
        },
      ];
    }
  };

  const navItems = getNavItems();

  const handleSettingsClick = () => {
    if (userType === "business_admin") {
      navigate("/BusinessSettings");
    } else if (userType === "business_subuser") {
      navigate("/SubUserSettings");
    } else {
      navigate("/Settings");
    }
  };

  // If sub-user, don't render this navbar
  if (userType === "business_subuser") {
    return null;
  }

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
            {userType === "business_admin" && businessName && (
              <p className="text-xs text-gray-300 truncate max-w-full">
                {businessName}
              </p>
            )}
            <p className="text-xs text-gray-300">
              {userType === "business_admin" ? "Business Admin" : 
               userType === "business_subuser" ? "Sub-user" : "Personal User"}
            </p>
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
            location.pathname === "/Settings" || 
            location.pathname === "/BusinessSettings" || 
            location.pathname === "/SubUserSettings"
              ? "bg-green-600 bg-opacity-30 shadow-lg"
              : "hover:bg-green-600 hover:bg-opacity-20"
          }`}
          style={{
            ...((location.pathname === "/Settings" || 
                 location.pathname === "/BusinessSettings" || 
                 location.pathname === "/SubUserSettings") && {
              borderLeft: "4px solid #6BB577",
            }),
          }}
        >
          <div
            className={`transition-transform duration-200 ${
              location.pathname === "/Settings" || 
              location.pathname === "/BusinessSettings" || 
              location.pathname === "/SubUserSettings"
                ? "scale-110"
                : ""
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
                location.pathname === "/Settings" || 
                location.pathname === "/BusinessSettings" || 
                location.pathname === "/SubUserSettings"
                  ? "font-semibold"
                  : ""
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