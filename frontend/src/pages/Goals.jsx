import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from './NavBar';
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const Goals = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ name: "", amount: "" });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editGoalIndex, setEditGoalIndex] = useState(null);
  const [editData, setEditData] = useState({ name: "", total: "", current: "" });

  // Function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  };

  // Save goals to sessionStorage whenever they change
  const saveGoalsToSessionStorage = (updatedGoals) => {
    try {
      const dashboardDataStr = sessionStorage.getItem("dashboard_data");
      let dashboardData = dashboardDataStr ? JSON.parse(dashboardDataStr) : {};
      
      // Update goals in dashboard data
      dashboardData.goals = updatedGoals;
      
      // Save back to sessionStorage
      sessionStorage.setItem("dashboard_data", JSON.stringify(dashboardData));
      
      // Trigger storage event so Dashboard can update
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Error saving goals to sessionStorage:", error);
    }
  };

  // Fetch goals from API
  const fetchGoalsFromAPI = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("No authentication token found");
        return [];
      }
      
      const response = await axios.get(`${API_BASE_URL}/dashboard/goals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.map(goal => ({
        name: goal.name,
        target: goal.target,
        current: goal.current,
        color: goal.color || "#36A2EB"
      }));
      
    } catch (error) {
      console.error("Error fetching goals:", error);
      return [];
    }
  };

  // Check user type and load goals on component mount
  useEffect(() => {
    const userType = sessionStorage.getItem("user_type");
    
    // Redirect business users away from this page
    if (userType === "business") {
      navigate("/BusinessDash");
      return;
    }
    
    // Load goals from API
    const loadGoals = async () => {
      const apiGoals = await fetchGoalsFromAPI();
      if (apiGoals.length > 0) {
        setGoals(apiGoals);
        saveGoalsToSessionStorage(apiGoals);
      } else {
        // Fallback to sessionStorage
        const dashboardDataStr = sessionStorage.getItem("dashboard_data");
        if (dashboardDataStr) {
          try {
            const dashboardData = JSON.parse(dashboardDataStr);
            if (dashboardData.goals && Array.isArray(dashboardData.goals)) {
              setGoals(dashboardData.goals);
            }
          } catch (error) {
            console.error("Error loading goals from sessionStorage:", error);
          }
        }
      }
    };
    
    loadGoals();
  }, [navigate]);

  // Add new goal function
  const addNewGoal = async () => {
    if (newGoal.name && newGoal.amount) {
      try {
        const token = getAuthToken();
        
        // Try to save via API first
        if (token) {
          try {
            await axios.post(
              `${API_BASE_URL}/goals/`,
              {
                name: newGoal.name,
                type: "savings",
                target_amount: parseFloat(newGoal.amount),
                current_amount: 0
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            
            // Fetch updated goals from API
            const apiGoals = await fetchGoalsFromAPI();
            setGoals(apiGoals);
            saveGoalsToSessionStorage(apiGoals);
            
          } catch (apiError) {
            console.error("API error, falling back to local storage:", apiError);
            // Fallback to local state
            const newGoalObj = {
              name: newGoal.name,
              target: parseFloat(newGoal.amount),
              current: 0,
              color: "#" + Math.floor(Math.random()*16777215).toString(16),
            };
            
            const updatedGoals = [...goals, newGoalObj];
            setGoals(updatedGoals);
            saveGoalsToSessionStorage(updatedGoals);
          }
        } else {
          // No token, use local storage
          const newGoalObj = {
            name: newGoal.name,
            target: parseFloat(newGoal.amount),
            current: 0,
            color: "#" + Math.floor(Math.random()*16777215).toString(16),
          };
          
          const updatedGoals = [...goals, newGoalObj];
          setGoals(updatedGoals);
          saveGoalsToSessionStorage(updatedGoals);
        }
        
      } catch (error) {
        console.error("Error adding goal:", error);
        // Final fallback
        const newGoalObj = {
          name: newGoal.name,
          target: parseFloat(newGoal.amount),
          current: 0,
          color: "#" + Math.floor(Math.random()*16777215).toString(16),
        };
        
        const updatedGoals = [...goals, newGoalObj];
        setGoals(updatedGoals);
        saveGoalsToSessionStorage(updatedGoals);
      }
      
      setNewGoal({ name: "", amount: "" });
      setShowAddGoal(false);
    }
  };

  // Update goal function
  const updateGoal = async () => {
    if (editGoalIndex !== null) {
      try {
        const token = getAuthToken();
        const goalToUpdate = goals[editGoalIndex];
        
        // Try to update via API if we have a token and goal has an ID
        if (token && goalToUpdate.id) {
          try {
            await axios.put(
              `${API_BASE_URL}/goals/${goalToUpdate.id}`,
              {
                name: editData.name,
                target_amount: Number(editData.total),
                current_amount: Number(editData.current)
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            
            // Fetch updated goals from API
            const apiGoals = await fetchGoalsFromAPI();
            setGoals(apiGoals);
            saveGoalsToSessionStorage(apiGoals);
            
          } catch (apiError) {
            console.error("API error, falling back to local storage:", apiError);
            // Fallback to local update
            const updated = [...goals];
            updated[editGoalIndex] = {
              ...updated[editGoalIndex],
              name: editData.name,
              target: Number(editData.total),
              current: Number(editData.current),
            };
            
            setGoals(updated);
            saveGoalsToSessionStorage(updated);
          }
        } else {
          // No API, use local update
          const updated = [...goals];
          updated[editGoalIndex] = {
            ...updated[editGoalIndex],
            name: editData.name,
            target: Number(editData.total),
            current: Number(editData.current),
          };
          
          setGoals(updated);
          saveGoalsToSessionStorage(updated);
        }
        
      } catch (error) {
        console.error("Error updating goal:", error);
        // Final fallback
        const updated = [...goals];
        updated[editGoalIndex] = {
          ...updated[editGoalIndex],
          name: editData.name,
          target: Number(editData.total),
          current: Number(editData.current),
        };
        
        setGoals(updated);
        saveGoalsToSessionStorage(updated);
      }
      
      setEditGoalIndex(null);
    }
  };

  const totalSaved = goals.reduce((acc, goal) => acc + goal.current, 0);
  const totalGoalAmount = goals.reduce((acc, goal) => acc + goal.target, 0);
  const overallProgress = totalGoalAmount > 0 ? (totalSaved / totalGoalAmount) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-gray-50" style={{ backgroundColor: '#E0E0E0' }}>
      <NavBar />

      <div className="flex-1 w-full">
        <div className="p-8 h-screen flex flex-col relative">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-[#333333]">Goals</h1>
              <button
                onClick={() => setShowAddGoal(true)}
                className="px-4 py-2 bg-[#89ce94] text-white rounded-lg hover:bg-[#7dc987] transition-colors"
              >
                + Create Goal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 border-2 border-[#86a59c] shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Total Saved</p>
                <p className="text-3xl font-bold text-[#643173]">
                  ${totalSaved.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-[#86a59c] shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Total Goal Amount</p>
                <p className="text-3xl font-bold text-[#7d5ba6]">
                  ${totalGoalAmount.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-[#86a59c] shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
                <p className="text-3xl font-bold text-[#89ce94]">
                  {overallProgress.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Goals List */}
            <div className="bg-white rounded-2xl border-2 border-[#86a59c] shadow-sm flex-1 flex flex-col overflow-hidden">
              <h2 className="text-xl font-semibold text-[#333333] p-8 pb-4 flex-shrink-0">
                Your Goals
              </h2>

              <div className="space-y-6 px-8 pb-8 overflow-y-auto flex-1">
                {goals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No goals set yet. Click "Create Goal" to add your first goal!
                  </div>
                ) : (
                  goals.map((goal, index) => {
                    const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-[#333333]">
                            {index + 1}. {goal.name}
                          </span>

                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span>
                              ${goal.current.toLocaleString()} out of ${goal.target.toLocaleString()}
                            </span>

                            <button
                              onClick={() => {
                                setEditGoalIndex(index);
                                setEditData({
                                  name: goal.name,
                                  total: goal.target.toString(),
                                  current: goal.current.toString(),
                                });
                              }}
                              className="px-3 py-1 bg-[#7d5ba6] text-white rounded-md hover:bg-[#6d4f96]"
                            >
                              Edit
                            </button>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: goal.color || "#89ce94",
                            }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{percentage.toFixed(1)}% complete</span>
                          <span>${(goal.target - goal.current).toLocaleString()} remaining</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ADD GOAL MODAL */}
            {showAddGoal && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 backdrop-blur-sm bg-white/20"></div>

                <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 z-10 border-2 border-[#7d5ba6]">
                  <h2 className="text-2xl font-bold text-[#333333] mb-6">Add New Goal</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#333333] mb-2">
                        Goal Name
                      </label>
                      <input
                        type="text"
                        value={newGoal.name}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                        placeholder="e.g., Vacation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#333333] mb-2">
                        Target Amount
                      </label>
                      <input
                        type="number"
                        value={newGoal.amount}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, amount: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                        placeholder="$0"
                      />
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setShowAddGoal(false)}
                        className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={addNewGoal}
                        className="flex-1 py-2 bg-[#89ce94] text-white rounded-lg hover:bg-[#7dc987]"
                      >
                        Add Goal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT GOAL MODAL */}
            {editGoalIndex !== null && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 backdrop-blur-sm bg-white/20"></div>

                <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 z-10 border-2 border-[#7d5ba6]">
                  <h2 className="text-2xl font-bold text-[#333333] mb-6">Edit Goal</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Goal Name</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Target Amount</label>
                      <input
                        type="number"
                        value={editData.total}
                        onChange={(e) =>
                          setEditData({ ...editData, total: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Current Saved</label>
                      <input
                        type="number"
                        value={editData.current}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          // Prevent exceeding total
                          if (val > Number(editData.total)) val = Number(editData.total);
                          if (val < 0) val = 0;
                          setEditData({ ...editData, current: val.toString() });
                        }}
                        className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                      />
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setEditGoalIndex(null)}
                        className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={updateGoal}
                        className="flex-1 py-2 bg-[#7d5ba6] text-white rounded-lg hover:bg-[#6d4f96]"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="fixed bottom-4 right-4 text-xs text-gray-500">
            App is owned by Team Nova in partner with Commerce Bank
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;