import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from './NavBar';

const BusinessGoals = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ name: "", amount: "", department: "" });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editGoalIndex, setEditGoalIndex] = useState(null);
  const [editData, setEditData] = useState({ name: "", target: "", current: "", department: "" });
  const [loading, setLoading] = useState(true);
  const [departments] = useState([
    "Sales",
    "Marketing", 
    "Operations",
    "R&D",
    "HR",
    "Finance",
    "IT",
    "Customer Support"
  ]);

  // Fetch goals from database on component mount
  useEffect(() => {
    fetchGoalsFromDatabase();
  }, []);

  const fetchGoalsFromDatabase = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
      
      if (!token) {
        console.error("No token found");
        navigate("/Login");
        return;
      }
      
      console.log("Fetching business goals from database...");
      
      const response = await fetch("http://localhost:8000/dashboard/business/goals", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched business goals:", data);
        setGoals(data);
      } else {
        console.error("Failed to fetch goals:", response.status);
        if (response.status === 401) {
          navigate("/Login");
        }
      }
    } catch (error) {
      console.error("Error fetching business goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentColor = (department) => {
    const colorMap = {
      "Sales": "#7D5BA6",
      "Marketing": "#6BB577",
      "Operations": "#4BC0C0",
      "R&D": "#9966FF",
      "HR": "#FF9F40",
      "Finance": "#8B5CF6",
      "IT": "#36A2EB",
      "Customer Support": "#FF6B8B",
      "General": "#A0AEC0",
      "Revenue": "#E63946",      // Red for revenue goals
      "Campaign": "#F77F00",     // Orange for campaigns
      "Cost": "#06A77D",         // Teal for cost reduction
      "Product": "#4361EE",      // Blue for products
      "Training": "#9D4EDD",     // Purple for training
      "Development": "#2A9D8F"   // Green for development
    };
    
    return colorMap[department] || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  };

  const addNewGoal = async () => {
    if (!newGoal.name || !newGoal.amount || !newGoal.department) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
      
      const response = await fetch("http://localhost:8000/dashboard/business/goals", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newGoal.name,
          amount: parseFloat(newGoal.amount),
          department: newGoal.department
        })
      });

      if (response.ok) {
        // Refresh goals from database
        await fetchGoalsFromDatabase();
        
        // Reset form
        setNewGoal({ name: "", amount: "", department: "" });
        setShowAddGoal(false);
        
        alert("Business goal created successfully!");
      } else {
        console.error("Failed to create goal:", response.status);
        alert("Failed to create goal. Please try again.");
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      alert("Error creating goal. Please try again.");
    }
  };

  const updateGoal = async () => {
    if (editGoalIndex !== null && editGoalIndex < goals.length) {
      const goalToUpdate = goals[editGoalIndex];
      
      try {
        const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
        
        const response = await fetch(`http://localhost:8000/dashboard/business/goals/${goalToUpdate.id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: editData.name,
            target: parseFloat(editData.target),
            current: parseFloat(editData.current),
            department: editData.department
          })
        });

        if (response.ok) {
          // Refresh goals from database
          await fetchGoalsFromDatabase();
          setEditGoalIndex(null);
        } else {
          console.error("Failed to update goal:", response.status);
          alert("Failed to update goal. Please try again.");
        }
      } catch (error) {
        console.error("Error updating goal:", error);
        alert("Error updating goal. Please try again.");
      }
    }
  };

  const deleteGoal = async (index) => {
    if (window.confirm("Are you sure you want to delete this business goal?")) {
      const goalToDelete = goals[index];
      
      try {
        const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
        
        const response = await fetch(`http://localhost:8000/dashboard/business/goals/${goalToDelete.id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          // Refresh goals from database
          await fetchGoalsFromDatabase();
        } else {
          console.error("Failed to delete goal:", response.status);
          alert("Failed to delete goal. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting goal:", error);
        alert("Error deleting goal. Please try again.");
      }
    }
  };
    
  const totalSaved = goals.reduce((acc, goal) => acc + goal.current, 0);
  const totalGoalAmount = goals.reduce((acc, goal) => acc + goal.target, 0);
  const overallProgress = totalGoalAmount > 0 ? (totalSaved / totalGoalAmount) * 100 : 0;

  // Get goals by department for the breakdown section
  const getGoalsByDepartment = () => {
    const deptMap = {};
    
    goals.forEach(goal => {
      if (!deptMap[goal.department]) {
        deptMap[goal.department] = {
          total: 0,
          target: 0,
          count: 0,
          color: goal.color
        };
      }
      deptMap[goal.department].total += goal.current;
      deptMap[goal.department].target += goal.target;
      deptMap[goal.department].count++;
    });
    
    return deptMap;
  };

  const departmentBreakdown = getGoalsByDepartment();

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl">Loading business goals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <NavBar />

      <div className="flex-1 w-full">
        <div className="p-6 h-screen flex flex-col relative">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#7D5BA6' }}>
                Business Goals
              </h1>
              <p className="text-lg text-gray-600">Track and manage your company's financial objectives</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2" style={{ borderColor: '#6BB577' }}>
                <p className="text-sm text-gray-600 mb-2">Total Achieved</p>
                <p className="text-4xl font-bold" style={{ color: '#36A2EB' }}>
                  ${totalSaved.toLocaleString()}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Across all departments
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border-2" style={{ borderColor: '#6BB577' }}>
                <p className="text-sm text-gray-600 mb-2">Total Goal Amount</p>
                <p className="text-4xl font-bold" style={{ color: '#7D5BA6' }}>
                  ${totalGoalAmount.toLocaleString()}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Combined target amount
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border-2" style={{ borderColor: '#6BB577' }}>
                <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
                <p className="text-4xl font-bold" style={{ color: '#4BC0C0' }}>
                  {overallProgress.toFixed(1)}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(overallProgress, 100)}%`, 
                      backgroundColor: '#4BC0C0' 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
              {/* Goals List Section */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="bg-white rounded-2xl shadow-lg border-2 flex-1 flex flex-col overflow-hidden" style={{ borderColor: '#6BB577' }}>
                  <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold" style={{ color: '#333333' }}>
                        Company Goals by Department
                      </h2>
                      <button
                        onClick={() => setShowAddGoal(true)}
                        className="px-5 py-2.5 bg-[#7D5BA6] text-white rounded-lg hover:bg-[#6d4f96] transition-colors shadow-md font-medium"
                      >
                        + Create Business Goal
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    {goals.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">🎯</div>
                        <p className="text-lg">No business goals set yet.</p>
                        <p className="text-sm mt-1">Create departmental goals to track company progress!</p>
                        <button
                          onClick={() => setShowAddGoal(true)}
                          className="mt-6 px-5 py-2.5 bg-[#7D5BA6] text-white rounded-lg hover:bg-[#6d4f96] transition-colors font-medium"
                        >
                          Create Your First Goal
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {goals.map((goal, index) => {
                          const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                          const deptColor = goal.color;
                          const remaining = Math.max(0, goal.target - goal.current);
                          
                          return (
                            <div key={goal.id} className="p-6 rounded-xl border-2 hover:shadow-md transition-all" 
                              style={{ 
                                borderColor: deptColor + '40',
                                backgroundColor: '#FFFFFF'
                              }}>
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                    style={{ backgroundColor: deptColor }}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-semibold" style={{ color: '#333333' }}>
                                      {goal.name}
                                    </h3>
                                    <div className="flex items-center mt-1">
                                      <span 
                                        className="text-xs px-3 py-1 rounded-full text-white font-medium"
                                        style={{ backgroundColor: deptColor }}
                                      >
                                        {goal.department}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-2xl font-bold" style={{ color: deptColor }}>
                                    ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    ${remaining.toLocaleString()} remaining
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-3">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                  <span>{percentage.toFixed(1)}% complete</span>
                                  <span>{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                  <div
                                    className="h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                                    style={{
                                      width: `${Math.min(percentage, 100)}%`,
                                      backgroundColor: deptColor,
                                      minWidth: '40px'
                                    }}
                                  >
                                    {percentage > 20 && (
                                      <span className="text-xs font-bold text-white">
                                        {percentage.toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: '#F3F4F6' }}>
                                <button
                                  onClick={() => {
                                    setEditGoalIndex(index);
                                    setEditData({
                                      name: goal.name,
                                      target: goal.target.toString(),
                                      current: goal.current.toString(),
                                      department: goal.department,
                                    });
                                  }}
                                  className="px-4 py-2 bg-[#7d5ba6] text-white rounded-lg hover:bg-[#6d4f96] transition-colors font-medium"
                                >
                                  Edit Goal
                                </button>
                                <button
                                  onClick={() => deleteGoal(index)}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Side Panel with Stats */}
              <div className="w-80 flex flex-col gap-6 overflow-y-auto min-h-0">
                {/* Department Breakdown */}
                <div className="bg-white rounded-2xl shadow-lg border-2 p-6 flex-shrink-0" style={{ borderColor: '#6BB577' }}>
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#333333' }}>
                    Department Breakdown
                  </h3>
                  <div className="space-y-4">
                    {Object.keys(departmentBreakdown).length === 0 ? (
                      <p className="text-gray-500 text-sm">No departmental goals yet</p>
                    ) : (
                      Object.entries(departmentBreakdown).map(([dept, data]) => {
                        const deptPercentage = data.target > 0 ? (data.total / data.target) * 100 : 0;
                        const deptColor = data.color;
                        
                        return (
                          <div key={dept} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-800">{dept}</span>
                              <span className="text-sm font-semibold" style={{ color: deptColor }}>
                                {deptPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${Math.min(deptPercentage, 100)}%`,
                                  backgroundColor: deptColor
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {data.count} goal{data.count !== 1 ? 's' : ''} • ${data.total.toLocaleString()} / ${data.target.toLocaleString()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ADD BUSINESS GOAL MODAL */}
            {showAddGoal && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

                <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 z-10 border-4 shadow-2xl" style={{ borderColor: '#7D5BA6' }}>
                  <h2 className="text-2xl font-bold text-[#333333] mb-6 text-center">Create Business Goal</h2>
                  <div className="space-y-5">
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
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-[#7d5ba6] transition-colors"
                        placeholder="e.g., Q2 Sales Target"
                        style={{ borderColor: '#86a59c' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#333333] mb-2">
                        Department
                      </label>
                      <select
                        value={newGoal.department}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, department: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-[#7d5ba6] transition-colors appearance-none"
                        style={{ borderColor: '#86a59c' }}
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#333333] mb-2">
                        Target Amount ($)
                      </label>
                      <input
                        type="number"
                        value={newGoal.amount}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, amount: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-[#7d5ba6] transition-colors"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        style={{ borderColor: '#86a59c' }}
                      />
                    </div>

                    <div className="flex space-x-3 mt-8">
                      <button
                        onClick={() => setShowAddGoal(false)}
                        className="flex-1 py-3 border-2 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        style={{ borderColor: '#D1D5DB' }}
                      >
                        Cancel
                      </button>

                      <button
                        onClick={addNewGoal}
                        disabled={!newGoal.name || !newGoal.amount || !newGoal.department}
                        className={`flex-1 py-3 rounded-lg transition-colors font-medium ${
                          !newGoal.name || !newGoal.amount || !newGoal.department
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-[#7d5ba6] hover:bg-[#6d4f96] text-white'
                        }`}
                      >
                        Create Goal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT BUSINESS GOAL MODAL */}
            {editGoalIndex !== null && editGoalIndex < goals.length && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

                <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 z-10 border-4 shadow-2xl" style={{ borderColor: '#7D5BA6' }}>
                  <h2 className="text-2xl font-bold text-[#333333] mb-6 text-center">Edit Business Goal</h2>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">Goal Name</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-[#7d5ba6] transition-colors"
                        style={{ borderColor: '#86a59c' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Department</label>
                      <select
                        value={editData.department}
                        onChange={(e) =>
                          setEditData({ ...editData, department: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-[#7d5ba6] transition-colors appearance-none"
                        style={{ borderColor: '#86a59c' }}
                      >
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Target Amount ($)</label>
                      <input
                        type="number"
                        value={editData.target}
                        onChange={(e) =>
                          setEditData({ ...editData, target: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-[#7d5ba6] transition-colors"
                        min="0"
                        step="0.01"
                        style={{ borderColor: '#86a59c' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Current Achieved ($)</label>
                      <input
                        type="number"
                        value={editData.current}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val > Number(editData.target)) val = Number(editData.target);
                          if (val < 0) val = 0;
                          setEditData({ ...editData, current: val.toString() });
                        }}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-[#7d5ba6] transition-colors"
                        min="0"
                        max={editData.target}
                        step="0.01"
                        style={{ borderColor: '#86a59c' }}
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        Maximum: ${Number(editData.target).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-8">
                      <button
                        onClick={() => setEditGoalIndex(null)}
                        className="flex-1 py-3 border-2 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        style={{ borderColor: '#D1D5DB' }}
                      >
                        Cancel
                      </button>

                      <button
                        onClick={updateGoal}
                        className="flex-1 py-3 bg-[#7d5ba6] text-white rounded-lg hover:bg-[#6d4f96] transition-colors font-medium"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-white px-3 py-2 rounded-lg shadow border" style={{ borderColor: '#E5E7EB' }}>
            App is owned by Team Nova in partner with Commerce Bank
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessGoals;