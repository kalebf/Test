import { useState, useEffect } from "react";
import NavBar from "./NavBar";
import PlotlyPersonal from "./PlotlyPersonal";
import axios from "axios";

// Add this at the top of your Dashboard component
const API_BASE_URL = "http://localhost:8000"; // Adjust as needed

export default function Dashboard() {
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState(null);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  // Function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  };

  // API call to fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Fetch all dashboard data at once
      const response = await axios.get(`${API_BASE_URL}/dashboard/summary`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = response.data;
      
      // Update state with real data
      setRecentPurchases(data.recent_purchases || []);
      setExpenseCategories(data.expense_categories || []);
      setGoals(data.goals || []);
      
      // Set user name from API response or session storage
      const nameFromAPI = data.user_name || "";
      const nameFromStorage = sessionStorage.getItem("name") || "";
      setUserName(nameFromAPI || nameFromStorage);
      
      // Also save to sessionStorage for persistence
      sessionStorage.setItem("dashboard_data", JSON.stringify({
        recentPurchases: data.recent_purchases || [],
        expenseCategories: data.expense_categories || [],
        goals: data.goals || []
      }));
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Fallback to sessionStorage if API fails
      const dashboardDataStr = sessionStorage.getItem("dashboard_data");
      if (dashboardDataStr) {
        const dashboardData = JSON.parse(dashboardDataStr);
        setRecentPurchases(dashboardData.recentPurchases || []);
        setExpenseCategories(dashboardData.expenseCategories || []);
        setGoals(dashboardData.goals || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(fetchDashboardData, 30000);
    
    // Listen for storage events to refresh data
    const handleStorageChange = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);
    window.addEventListener('userDataInitialized', handleStorageChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
      window.removeEventListener('userDataInitialized', handleStorageChange);
    };
  }, []);
  
  // ... rest of your Dashboard.jsx code remains the same ...

  const cardShadow = {
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  };

  const headerShadow = {
    boxShadow: "0 3px 6px rgba(0, 0, 0, 0.12)",
  };

  if (loading) {
    return (
      <div
        className="flex h-screen w-screen overflow-hidden"
        style={{ backgroundColor: "#E8E8E8" }}
      >
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-gray-600">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ backgroundColor: "#E8E8E8" }}
    >
      <NavBar />

      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Welcome Header */}
        <div className="mb-4">
          <h1 className="text-4xl font-bold mb-1" style={{ color: "#7D5BA6" }}>
            Welcome Back{userName ? `, ${userName.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-lg text-gray-600">
            Here's an overview of your finances
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* LEFT SIDE */}
          <div className="flex-1 flex flex-col gap-6">
            {/*RECENT PURCHASES*/}
            <div
              className="flex-1 rounded-xl border-4 bg-white overflow-hidden"
              style={{ borderColor: "#6BB577", ...cardShadow }}
            >
              <div
                style={{
                  backgroundColor: "#7D5BA6",
                  color: "white",
                  fontSize: "26px",
                  textAlign: "center",
                  padding: "10px 0",
                  fontFamily: "Carme, sans-serif",
                  fontWeight: "500",
                  ...headerShadow,
                }}
              >
                Recent Purchases
              </div>
              <div
                className="p-4 overflow-y-auto"
                style={{ height: "calc(100% - 60px)" }}
              >
                {recentPurchases.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No recent purchases available
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr
                        className="border-b-2"
                        style={{ borderColor: "#E5E5E5" }}
                      >
                        <th className="text-left py-2 px-4 font-semibold text-gray-600">
                          Item
                        </th>
                        <th className="text-left py-2 px-4 font-semibold text-gray-600">
                          Date
                        </th>
                        <th className="text-right py-2 px-4 font-semibold text-gray-600">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPurchases.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b"
                          style={{ borderColor: "#F5F5F5" }}
                        >
                          <td className="py-3 px-4 text-gray-800">{p.item}</td>
                          <td className="py-3 px-4 text-gray-600">{p.date}</td>
                          <td
                            className="py-3 px-4 text-right font-semibold"
                            style={{ color: "#7D5BA6" }}
                          >
                            {p.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/*GOALS*/}
            <div
              className="flex-1 rounded-xl border-4 overflow-hidden"
              style={{ borderColor: "#6BB577", ...cardShadow }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #8FD8A3 0%, #A8E2B8 100%)",
                  color: "#2C5F3B",
                  fontSize: "26px",
                  textAlign: "center",
                  padding: "10px 0",
                  fontFamily: "Carme, sans-serif",
                  fontWeight: "600",
                  ...headerShadow,
                }}
              >
                Goals
              </div>
              <div
                className="p-6 space-y-6 overflow-auto"
                style={{
                  background:
                    "linear-gradient(180deg, #E8F5EA 0%, #F0F9F1 100%)",
                  height: "calc(100% - 60px)",
                }}
              >
                {goals.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No goals set yet
                  </div>
                ) : (
                  goals.map((goal, i) => {
                    const percentage = (goal.current / goal.target) * 100;
                    return (
                      <div
                        key={i}
                        className="bg-white rounded-lg p-4"
                        style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)" }}
                      >
                        <div className="flex justify-between mb-3">
                          <span className="font-semibold text-gray-800">
                            {goal.name}
                          </span>
                          <span className="font-medium text-gray-600">
                            ${goal.current.toLocaleString()} / $
                            {goal.target.toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="w-full bg-gray-200 rounded-full h-5"
                          style={{
                            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.08)",
                          }}
                        >
                          <div
                            className="h-5 rounded-full flex items-center justify-end pr-2 text-white text-xs font-semibold"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: goal.color,
                              boxShadow: `0 2px 4px ${goal.color}60`,
                              minWidth: percentage > 0 ? "30px" : "0",
                            }}
                          >
                            {percentage > 15 && `${percentage.toFixed(0)}%`}
                          </div>
                        </div>
                        {percentage <= 15 && (
                          <div className="text-right text-xs text-gray-600 mt-1">
                            {percentage.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="flex-1">
            <div
              className="h-full rounded-xl border-4 bg-white overflow-hidden"
              style={{ borderColor: "#6BB577", ...cardShadow }}
            >
              <div
                style={{
                  backgroundColor: "#7D5BA6",
                  color: "white",
                  fontSize: "26px",
                  textAlign: "center",
                  padding: "10px 0",
                  fontFamily: "Carme, sans-serif",
                  fontWeight: "500",
                  ...headerShadow,
                }}
              >
                Expense Categories
              </div>

              <div
                className="flex flex-col h-full"
                style={{ height: "calc(100% - 60px)" }}
              >
                {/* Pie chart */}
                <div
                  style={{
                    background:
                      "linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)",
                    height: "60%",
                    padding: "2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{ width: "80%", height: "80%", minHeight: "300px" }}
                  >
                    <PlotlyPersonal
                      data={expenseCategories}
                      hoveredIndex={hoveredCategoryIndex}
                    />
                  </div>
                </div>

                {/* Categories */}
                <div
                  className="p-6 bg-white"
                  style={{ height: "40%", overflow: "auto" }}
                >
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">
                    Monthly Breakdown
                  </h3>
                  {expenseCategories.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No expense data available
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {expenseCategories.map((cat, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg transition-all hover:scale-105"
                            style={{
                              backgroundColor: "#FAFAFA",
                              border: `2px solid ${cat.color}30`,
                              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.06)",
                              cursor: "pointer",
                            }}
                            onMouseEnter={() => setHoveredCategoryIndex(i)}
                            onMouseLeave={() => setHoveredCategoryIndex(null)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                style={{
                                  width: 14,
                                  height: 14,
                                  backgroundColor: cat.color,
                                  borderRadius: 4,
                                  boxShadow: `0 2px 6px ${cat.color}50`,
                                }}
                              ></div>
                              <span className="font-medium text-gray-800 text-sm">
                                {cat.name}
                              </span>
                            </div>
                            <span className="font-bold text-gray-700 text-sm">
                              ${cat.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t-2 border-gray-200 flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-600">
                          Total Expenses
                        </span>
                        <span
                          className="text-xl font-bold"
                          style={{ color: "#7D5BA6" }}
                        >
                          $
                          {expenseCategories.reduce(
                            (sum, cat) => sum + cat.value,
                            0
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          fontSize: "11px",
          color: "#888",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "6px 10px",
          borderRadius: "6px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
        }}
      >
        App is owned by Team Nova in partner with Commerce Bank
      </div>
    </div>
  );
}