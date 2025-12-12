// BusinessDash.jsx
import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';
import PlotlyBusiness from './PlotlyBusiness';

function BusinessDash({
  budget = { used: 0, total: 1 },
  incomeData = [],
  expenseData = [],
  recentIncome = [],
  recentExpenses = []
}) {
  const [dashboardData, setDashboardData] = useState({
    budget,
    incomeData,
    expenseData,
    recentIncome,
    recentExpenses
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Always fetch data when component mounts
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      
      // FIX: Use 'access_token' instead of 'token' to match login
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
      
      if (!token) {
        console.error("No authentication token found");
        window.location.href = "/Login";
        return;
      }
      
      console.log("=== FETCHING BUSINESS DATA ===");
      
      const response = await fetch("http://localhost:8000/dashboard/business/summary", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("=== BUSINESS DASHBOARD RAW RESPONSE ===");
        console.log("Full response:", data);
        console.log("Budget:", data.budget);
        console.log("Income data:", data.incomeData);
        console.log("Expense data:", data.expenseData);
        console.log("Recent income:", data.recentIncome?.length);
        console.log("Recent expenses:", data.recentExpenses?.length);
        
        setDashboardData({
          budget: data.budget || { used: 0, total: 60000 },
          incomeData: data.incomeData || [],
          expenseData: data.expenseData || [],
          recentIncome: data.recentIncome || [],
          recentExpenses: data.recentExpenses || []
        });
        
      } else {
        console.error("Failed to fetch business data:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        if (response.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = "/Login";
        }
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#E8E8E8' }}>
        <NavBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading business data...</div>
        </div>
      </div>
    );
  }

  const budgetPercentage = (dashboardData.budget.used / dashboardData.budget.total) * 100;

  const cardShadow = {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  const headerShadow = {
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.12)'
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#E8E8E8' }}>
      <NavBar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>

        {/* Budget Section */}
        <div
          style={{
            borderRadius: '12px',
            border: '3px solid #6BB577',
            backgroundColor: 'white',
            overflow: 'hidden',
            height: '180px',
            ...cardShadow
          }}
        >
          <div style={{
            backgroundColor: '#7D5BA6',
            color: 'white',
            fontSize: '26px',
            textAlign: 'center',
            padding: '10px 0',
            fontFamily: 'Carme, sans-serif',
            fontWeight: '500',
            ...headerShadow
          }}>
            Budget
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>Total Budget Usage</span>
              <span style={{ fontSize: '20px', fontWeight: '500', color: '#555' }}>
                ${dashboardData.budget.used.toLocaleString()} / ${dashboardData.budget.total.toLocaleString()}
              </span>
            </div>
            <div style={{
              width: '100%',
              backgroundColor: '#F0F0F0',
              borderRadius: '9999px',
              height: '32px',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
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
                  fontSize: '15px',
                  width: `${budgetPercentage}%`,
                  backgroundColor: '#7D5BA6',
                  boxShadow: '0 2px 6px rgba(125, 91, 166, 0.4)'
                }}
              >
                {budgetPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Income and Expenses Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: 'calc(100vh - 280px)' }}>

          {/* Income */}
          <div
            style={{
              borderRadius: '12px',
              border: '3px solid #6BB577',
              backgroundColor: 'white',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              ...cardShadow
            }}
          >
            <div style={{
              backgroundColor: '#7D5BA6',
              color: 'white',
              fontSize: '26px',
              textAlign: 'center',
              padding: '10px 0',
              fontFamily: 'Carme, sans-serif',
              fontWeight: '500',
              ...headerShadow
            }}>
              Income
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <PlotlyBusiness data={dashboardData.incomeData} color="#5CB85C" type="income" />
              </div>
            </div>
            <div style={{ borderTop: '1px solid #E5E5E5', flex: 1, overflowY: 'auto', padding: '16px' }}>
              <h3 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '12px', color: '#333' }}>Recent Income</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentIncome.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#999', fontStyle: 'italic' }}>
                        No recent income transactions
                      </td>
                    </tr>
                  ) : (
                    dashboardData.recentIncome.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                        <td style={{ padding: '8px', fontSize: '14px', color: '#333' }}>{item.description}</td>
                        <td style={{ padding: '8px', fontSize: '14px', color: '#666' }}>{item.date}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#5CB85C' }}>
                          {item.amount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expenses */}
          <div
            style={{
              borderRadius: '12px',
              border: '3px solid #6BB577',
              backgroundColor: 'white',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              ...cardShadow
            }}
          >
            <div style={{
              backgroundColor: '#7D5BA6',
              color: 'white',
              fontSize: '26px',
              textAlign: 'center',
              padding: '10px 0',
              fontFamily: 'Carme, sans-serif',
              fontWeight: '500',
              ...headerShadow
            }}>
              Expenses
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <PlotlyBusiness data={dashboardData.expenseData} color="#E67E9F" type="expense" />
              </div>
            </div>
            <div style={{ borderTop: '1px solid #E5E5E5', flex: 1, overflowY: 'auto', padding: '16px' }}>
              <h3 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '12px', color: '#333' }}>Recent Expenses</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#999', fontStyle: 'italic' }}>
                        No recent expense transactions
                      </td>
                    </tr>
                  ) : (
                    dashboardData.recentExpenses.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                        <td style={{ padding: '8px', fontSize: '14px', color: '#333' }}>{item.description}</td>
                        <td style={{ padding: '8px', fontSize: '14px', color: '#666' }}>{item.date}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#E67E9F' }}>
                          {item.amount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

export default BusinessDash;

// Note: SubUserDash.jsx already correctly uses 'access_token' so no changes needed there