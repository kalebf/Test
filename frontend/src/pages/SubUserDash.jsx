import React, { useState, useEffect } from 'react';
import PlotlyBusiness from './PlotlyBusiness'; 
import SubUserNavBar from './SubUserNavBar'; // Add this import

function SubUserDash() {
  const [userName, setUserName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = () => {
      const userNameFromStorage = localStorage.getItem("user_name") || sessionStorage.getItem("user_name");
      const businessNameFromStorage = localStorage.getItem("business_name") || sessionStorage.getItem("business_name");
      
      if (userNameFromStorage) {
        setUserName(userNameFromStorage);
      }
      
      if (businessNameFromStorage) {
        setBusinessName(businessNameFromStorage);
      }
      
      setLoading(false);
    };
    
    loadUserData();
  }, []);

  // 🔹 EMPTY DEFAULT DATA (prevents crashes)
  const projectName = businessName || 'My Business';

  const budget = {
    used: 0,
    total: 1 // cannot be 0 or you'll get divide by zero!
  };

  const incomeData = [];        // empty graph data
  const expenseData = [];       // empty graph data

  const recentIncome = [];      // empty table list
  const recentExpenses = [];    // empty table list

  const budgetPercentage = (budget.used / budget.total) * 100;

  const cardShadow = {
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#E0E0E0'
      }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

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
          ...cardShadow
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
                  backgroundColor: '#7D5BA6'
                }}
              >
                {budgetPercentage.toFixed(1)}%
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

            <div style={{ padding: '16px' }}>
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
                paddingTop: '16px'
              }}>Recent Income</h3>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncome.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px' }}>{item.description}</td>
                      <td style={{ padding: '8px' }}>{item.date}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#89CE94' }}>
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

            <div style={{ padding: '16px' }}>
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
                paddingTop: '16px'
              }}>Recent Expenses</h3>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px' }}>{item.description}</td>
                      <td style={{ padding: '8px' }}>{item.date}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#FFA8C3' }}>
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="fixed bottom-4 right-4 text-xs text-gray-500">
            App is owned by Team Nova in partner with Commerce Bank
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubUserDash;