import React, { useState, useEffect } from 'react';
import SubUserNavBar from './SubUserNavBar';
import PlotlyBusiness from './PlotlyBusiness';
import { authAPI } from '../services/api';

function SubUserDash() {
  const [userName, setUserName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState({ used: 0, total: 1 });
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [recentIncome, setRecentIncome] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [error, setError] = useState("");

 useEffect(() => {
  const loadUserData = async () => {
    try {
      // Get user info from storage
      const userNameFromStorage = localStorage.getItem("user_name") || sessionStorage.getItem("user_name");
      const businessNameFromStorage = localStorage.getItem("business_name") || sessionStorage.getItem("business_name");
      
      if (userNameFromStorage) {
        setUserName(userNameFromStorage);
      }
      
      if (businessNameFromStorage) {
        setBusinessName(businessNameFromStorage);
      }
      
      // Option A: Use fetch with correct token retrieval
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      
      if (!token) {
        console.error("No token found");
        window.location.href = "/Login";
        return;
      }
      
      console.log("Fetching business data...");
      
      const response = await fetch("http://localhost:8000/dashboard/business/summary", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Business dashboard data:", data);
        
        // Set dashboard data from API
        setBudget(data.budget || { used: 0, total: 1 });
        setIncomeData(data.incomeData || []);
        setExpenseData(data.expenseData || []);
        setRecentIncome(data.recentIncome || []);
        setRecentExpenses(data.recentExpenses || []);
        
        if (data.business_name) {
          setBusinessName(data.business_name);
          sessionStorage.setItem("business_name", data.business_name);
        }
      } else {
        console.error("API Error:", response.status);
        if (response.status === 401) {
          // Clear tokens and redirect
          localStorage.removeItem("access_token");
          sessionStorage.removeItem("access_token");
          window.location.href = "/Login";
        }
      }
      
    } catch (error) {
      console.error("Error loading business data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  loadUserData();
}, []);
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        overflow: 'hidden', 
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading business data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        overflow: 'hidden', 
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ color: '#d32f2f', fontSize: '18px', fontWeight: 'bold' }}>{error}</div>
        <button 
          onClick={() => window.location.href = "/Login"}
          style={{
            padding: '10px 20px',
            backgroundColor: '#7D5BA6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  const budgetPercentage = (budget.used / budget.total) * 100;
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#E0E0E0'
    }}>
      
      {/* Use SubUserNavBar instead of inline navbar */}
      <SubUserNavBar />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
        
        {/* Welcome Title */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#7D5BA6',
            fontFamily: 'Carme, sans-serif'
          }}>
            Welcome Back{userName ? `, ${userName.split(" ")[0]}` : ""}!
          </h1>
          {businessName && (
            <div style={{
              backgroundColor: '#89CE94',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {businessName}
            </div>
          )}
        </div>

        {/* Budget Section */}
        <div style={{
          borderRadius: '12px',
          border: '4px solid #89CE94',
          backgroundColor: 'white',
          height: '180px',
          overflow: 'hidden',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div style={{
            backgroundColor: '#7D5BA6',
            color: 'white',
            fontSize: '26px',
            textAlign: 'center',
            padding: '10px 0'
          }}>
            Budget
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: '600' }}>Total Budget Usage</span>
              <span style={{ fontSize: '20px' }}>
                ${budget.used.toLocaleString()} / ${budget.total.toLocaleString()}
              </span>
            </div>

            <div style={{
              width: '100%',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              height: '32px'
            }}>
              <div
                style={{
                  height: '32px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  width: `${budgetPercentage}%`,
                  backgroundColor: '#7D5BA6',
                  transition: 'width 0.5s ease'
                }}
              >
                {budgetPercentage > 5 ? `${budgetPercentage.toFixed(1)}%` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Graph + Tables */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          height: 'calc(100vh - 370px)'
        }}>
          
          {/* Income Card */}
          <div style={{
            borderRadius: '12px',
            border: '4px solid #89CE94',
            backgroundColor: 'white',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#7D5BA6',
              color: 'white',
              fontSize: '26px',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              Income
            </div>

            <div style={{ padding: '16px', height: '220px' }}>
              <PlotlyBusiness data={incomeData} color="#89CE94" type="income" />
            </div>

            <div style={{
              borderTop: '1px solid #e5e7eb',
              flex: 1,
              overflowY: 'auto',
              padding: '0 16px 16px 16px'
            }}>
              <h3 style={{
                fontWeight: '600',
                fontSize: '18px',
                marginBottom: '12px',
                paddingTop: '16px',
                position: 'sticky',
                top: 0,
                backgroundColor: 'white'
              }}>Recent Income</h3>

              {recentIncome.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  No recent income transactions
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666' }}>Description</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666' }}>Date</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#666' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIncome.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px', fontSize: '14px', color: '#333' }}>{item.description}</td>
                        <td style={{ padding: '8px', fontSize: '14px', color: '#666' }}>{item.date}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#89CE94' }}>
                          {item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Expenses Card */}
          <div style={{
            borderRadius: '12px',
            border: '4px solid #89CE94',
            backgroundColor: 'white',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#7D5BA6',
              color: 'white',
              fontSize: '26px',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              Expenses
            </div>

            <div style={{ padding: '16px', height: '220px' }}>
              <PlotlyBusiness data={expenseData} color="#FFA8C3" type="expenses" />
            </div>

            <div style={{
              borderTop: '1px solid #e5e7eb',
              flex: 1,
              overflowY: 'auto',
              padding: '0 16px 16px 16px'
            }}>
              <h3 style={{
                fontWeight: '600',
                fontSize: '18px',
                marginBottom: '12px',
                paddingTop: '16px',
                position: 'sticky',
                top: 0,
                backgroundColor: 'white'
              }}>Recent Expenses</h3>

              {recentExpenses.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  No recent expense transactions
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666' }}>Description</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666' }}>Date</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#666' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExpenses.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px', fontSize: '14px', color: '#333' }}>{item.description}</td>
                        <td style={{ padding: '8px', fontSize: '14px', color: '#666' }}>{item.date}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#FFA8C3' }}>
                          {item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          fontSize: '11px',
          color: '#888',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '6px 10px',
          borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)'
        }}>
          App is owned by Team Nova in partner with Commerce Bank
        </div>
      </div>
    </div>
  );
}

export default SubUserDash; // ADD THIS LINE
